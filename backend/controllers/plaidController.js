const User = require('../models/user');
const Transaction = require('../models/transaction');
require('dotenv').config();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

let plaidClient = new PlaidApi(configuration);

const normalizeLegacyPlaidItems = (user) => {
  if (!user) {
    return [];
  }

  const existingItems = Array.isArray(user.plaidItems)
    ? user.plaidItems
        .filter((item) => item && item.itemId && item.accessToken)
        .map((item) => ({
          itemId: item.itemId,
          accessToken: item.accessToken,
          cursor: item.cursor || null,
        }))
    : [];

  if (existingItems.length > 0) {
    return existingItems;
  }

  const legacyAccessToken = user.access_token;
  if (!legacyAccessToken) {
    return [];
  }

  const legacyItemIds = Array.isArray(user.item_id) ? user.item_id.filter(Boolean) : [];
  if (legacyItemIds.length === 0) {
    return [
      {
        itemId: 'legacy-item',
        accessToken: legacyAccessToken,
        cursor: user.plaidCursor || null,
      },
    ];
  }

  return legacyItemIds.map((itemId) => ({
    itemId,
    accessToken: legacyAccessToken,
    cursor: user.plaidCursor || null,
  }));
};

const upsertPlaidItem = (items, nextItem) => {
  const currentItems = Array.isArray(items) ? [...items] : [];
  const index = currentItems.findIndex((item) => item.itemId === nextItem.itemId);
  const mergedItem = {
    itemId: nextItem.itemId,
    accessToken: nextItem.accessToken,
    cursor: nextItem.cursor ?? (index >= 0 ? currentItems[index].cursor ?? null : null),
  };

  if (index >= 0) {
    currentItems[index] = mergedItem;
  } else {
    currentItems.push(mergedItem);
  }

  return currentItems;
};

const ensurePlaidItemsOnUser = async (user) => {
  const normalizedItems = normalizeLegacyPlaidItems(user);
  if ((!Array.isArray(user.plaidItems) || user.plaidItems.length === 0) && normalizedItems.length > 0) {
    user.plaidItems = normalizedItems;
    await user.save();
  }
  return normalizedItems;
};

const buildTransactionDocument = (transaction, userID) => ({
  name: transaction.name,
  type: handleTransactionType(transaction.amount),
  amount: handleTransactionAmount(transaction.amount),
  userID,
  plaidTransactionID: transaction.transaction_id,
  date: transaction.date || new Date(),
  category: transaction.category || [],
});

// Link account using plaid
const createLinkToken = async (req, res) => {
  try {
    const userID = req.user._id.toString();
    const request = {
      user: {
        client_user_id: userID,
      },
      client_name: 'Plaid Test App',
      products: [process.env.PLAID_PRODUCTS],
      language: 'en',
      country_codes: [process.env.PLAID_COUNTRY_CODES],
    };

    const createTokenResponse = await plaidClient.linkTokenCreate(request);
    return res.json(createTokenResponse.data);
  } catch (error) {
    console.error('Error creating Link token:', error);
    return res.status(500).json('Failed to create Link token.');
  }
};

const exchangePublicToken = async (req, res) => {
  const { public_token: publicToken } = req.body;
  if (!publicToken) {
    return res.status(400).json({ error: 'public_token is required' });
  }

  try {
    const user = await User.findById(req.user._id.toString());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ensurePlaidItemsOnUser(user);

    const exchangeTokenResponse = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchangeTokenResponse.data.access_token;
    const itemId = exchangeTokenResponse.data.item_id;

    user.plaidItems = upsertPlaidItem(user.plaidItems, {
      itemId,
      accessToken,
      cursor: null,
    });

    // Keep legacy fields for backward compatibility during migration.
    user.access_token = accessToken;
    if (!Array.isArray(user.item_id)) {
      user.item_id = [];
    }
    if (!user.item_id.includes(itemId)) {
      user.item_id.push(itemId);
    }
    await user.save();

    return res.json({
      access_token: accessToken,
      item_id: itemId,
      linked_items: user.plaidItems.map((item) => item.itemId),
    });
  } catch (error) {
    console.error('Error exchanging public token:', error.message);
    return res.status(500).json({ error: 'Failed to exchange public token.' });
  }
};

const retrievePlaidTransactions = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plaidItems = await ensurePlaidItemsOnUser(user);
    if (plaidItems.length === 0) {
      return res.status(400).json({ error: 'No linked Plaid items found for user.' });
    }

    const fullResults = await Promise.all(
      plaidItems.map(async (item) => syncTransactions(item, userId))
    );
    return res.json({ completeResults: fullResults });
  } catch (error) {
    console.error('Running into an error!', error);
    return res.status(500).json({ error: 'Failed to retrieve Plaid transactions.' });
  }
};

const syncTransactions = async (item, userID) => {
  const allData = await fetchNewSyncData(item.accessToken, item.cursor);

  await Promise.all(
    allData.added.map(async (transaction) => {
      const payload = buildTransactionDocument(transaction, userID);
      await Transaction.findOneAndUpdate(
        { userID, plaidTransactionID: transaction.transaction_id },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    })
  );

  await Promise.all(
    allData.modified.map(async (transaction) => {
      const payload = buildTransactionDocument(transaction, userID);
      await Transaction.findOneAndUpdate(
        { userID, plaidTransactionID: transaction.transaction_id },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    })
  );

  await Promise.all(
    allData.removed.map(async (transaction) => {
      await Transaction.findOneAndDelete({
        userID,
        plaidTransactionID: transaction.transaction_id,
      });
    })
  );

  await User.updateOne(
    { _id: userID, 'plaidItems.itemId': item.itemId },
    {
      $set: {
        'plaidItems.$.cursor': allData.nextCursor,
        plaidCursor: allData.nextCursor,
      },
    }
  );

  return {
    itemId: item.itemId,
    added: allData.added.length,
    modified: allData.modified.length,
    removed: allData.removed.length,
  };
};

const handleTransactionType = (amount) => {
  if (amount < 0) {
    return 'income';
  }
  return 'expense';
};

const handleTransactionAmount = (amount) => {
  if (amount < 0) {
    return amount * -1;
  }
  return amount;
};

const fetchNewSyncData = async (accessToken, cursor, retriesLeft = 3) => {
  const allData = {
    added: [],
    removed: [],
    modified: [],
    nextCursor: cursor || null,
  };

  if (retriesLeft <= 0) {
    console.error('Too many retries!');
    return allData;
  }

  try {
    let keepGoing = false;
    do {
      const results = await plaidClient.transactionsSync({
        access_token: accessToken,
        options: {
          include_personal_finance_category: true,
        },
        cursor: allData.nextCursor,
      });
      const newData = results.data;
      allData.added = allData.added.concat(newData.added);
      allData.modified = allData.modified.concat(newData.modified);
      allData.removed = allData.removed.concat(newData.removed);
      allData.nextCursor = newData.next_cursor;
      keepGoing = newData.has_more;
      console.log(
        `Added: ${newData.added.length} Modified: ${newData.modified.length} Removed: ${newData.removed.length} `
      );
    } while (keepGoing === true);
    return allData;
  } catch (error) {
    console.log(`Oh no! Error! ${JSON.stringify(error)} Let's try again from the beginning!`);
    return fetchNewSyncData(accessToken, cursor, retriesLeft - 1);
  }
};

const setPlaidClient = (client) => {
  plaidClient = client;
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  retrievePlaidTransactions,
  __private: {
    normalizeLegacyPlaidItems,
    upsertPlaidItem,
    ensurePlaidItemsOnUser,
    syncTransactions,
    fetchNewSyncData,
    setPlaidClient,
  },
};
