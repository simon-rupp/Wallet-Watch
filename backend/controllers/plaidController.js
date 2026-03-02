const User = require('../models/user')
const Transaction = require('../models/transaction')
require('dotenv').config()
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
  
  const plaidClient = new PlaidApi(configuration);

// Link account using plaid
const createLinkToken = async (req, res) => {
    
    try {
        
      // Get the client_user_id by searching for the current user 
      const UserID = req.user._id.toString();
  
      const request = {
        user: {
          // This should correspond to a unique id for the current user.
          client_user_id: UserID,
        },
        client_name: 'Plaid Test App',
        products: [process.env.PLAID_PRODUCTS],
        language: 'en',
        //webhook: 'https://webhook.example.com',
        //redirect_uri: 'https://domainname.com/oauth-page.html',
        country_codes: [process.env.PLAID_COUNTRY_CODES],
      };
    
      const createTokenResponse = await plaidClient.linkTokenCreate(request);
      res.json(createTokenResponse.data);
    } catch (error) {
      console.error('Error creating Link token:', error);
      res.status(500).json('Failed to create Link token.' );
    }
};

const exchangePublicToken = async (req, res) => {
    
    const { public_token } = req.body;
    
    try {
        const exchangeTokenResponse = await plaidClient.itemPublicTokenExchange({public_token: public_token});
        
        // Save access_token and item_id to database 
        const access_token = exchangeTokenResponse.data.access_token;
        const item_id = exchangeTokenResponse.data.item_id;
        
        // Get the client_user_id by searching for the current user and update user to add access_token and item_id
        const user = req.user._id.toString();
        await User.findByIdAndUpdate(user, {access_token,  $push: {item_id}});
        

        res.json({ access_token, item_id });
    } catch (error) {
        // Handle error
        console.error('Error exchanging public token:', error.message);
        res.status(500).json({ error: 'Failed to exchange public token.' });
    }
};

const retrievePlaidTransactions = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const user = await User.findById(userId);
    const items = user.item_id;
    console.log(items);
    const fullResults = await Promise.all(
      items.map(async (item) => await syncTransactions(item, user))
    );
    res.json({ completeResults: fullResults });
  } catch (error) {
    console.log(`Running into an error!`, error);
    res.status(500).json({ error: 'Failed to retrieve Plaid transactions.' });
  }
};

const syncTransactions = async (itemId, user) => {
  
  // get access_token and cursor from database
  const access_token = user.access_token;
  const cursor = user.plaidCursor;


  const allData = await fetchNewSyncData(access_token, cursor);

  await Promise.all(
    allData.added.map(async (transaction) => {
      
      await Transaction.create({
        name: transaction.name,
        type: handleTransactionType(transaction.amount),
        amount: handleTransactionAmount(transaction.amount),
        userID: user._id,
        plaidTransactionID: transaction.transaction_id,
        date: transaction.date,
        category: transaction.category,
      });
}))

  await Promise.all(
    allData.modified.map(async (transaction) => {

      await Transaction.findOneAndUpdate(
        { plaidTransactionID: transaction.transaction_id },
        {
          name: transaction.name,
          type: handleTransactionType(transaction.amount),
          amount: handleTransactionAmount(transaction.amount),
          userID: user._id,
          plaidTransactionID: transaction.transaction_id,
          date: transaction.date,
          category: transaction.category,
        }
      );
    }
  ));

  await Promise.all(
    allData.removed.map(async (transaction) => {
      await Transaction.findOneAndDelete({
        plaidTransactionID: transaction.transaction_id,
      });
    }
  ));

  // update cursor in database
  await User.findByIdAndUpdate(user._id, { plaidCursor: allData.nextCursor });

}

const handleTransactionType = (amount) => {
  if (amount < 0) {
    return 'income';
  } else {
    return 'expense';
  }
};

const handleTransactionAmount = (amount) => {
  if (amount < 0) {
    return amount * -1;
  } else {
    return amount;
  }
};

const fetchNewSyncData = async (accessToken, cursor, retriesLeft = 3) => {

  const allData = {
    added: [],
    removed: [],
    modified: [],
    // handle an initial cursor of null

    nextCursor: cursor || null,
  };
  if (retriesLeft <= 0) {
    console.error("Too many retries!");
    // return no data and keep our original cursor
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
}


module.exports = { createLinkToken, exchangePublicToken, retrievePlaidTransactions };
