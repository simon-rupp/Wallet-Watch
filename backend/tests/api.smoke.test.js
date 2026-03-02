const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/user');
const Transaction = require('../models/transaction');

process.env.NODE_ENV = 'test';
process.env.SECRET = process.env.SECRET || 'test-secret';

const app = require('../app');
const { __private: plaidPrivate } = require('../controllers/plaidController');

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

test.beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('auth and transaction CRUD smoke flow', async () => {
  const registerRes = await request(app)
    .post('/api/user/register')
    .send({ username: 'smoke-user', password: 'password123' });

  assert.equal(registerRes.status, 201);
  assert.ok(registerRes.body.token);

  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ username: 'smoke-user', password: 'password123' });

  assert.equal(loginRes.status, 201);
  assert.ok(loginRes.body.token);

  const authHeader = `Bearer ${loginRes.body.token}`;

  const unauthorizedListRes = await request(app).get('/api/transactions');
  assert.equal(unauthorizedListRes.status, 401);

  const createRes = await request(app)
    .post('/api/transactions')
    .set('Authorization', authHeader)
    .send({
      name: 'Test Rent',
      type: 'expense',
      amount: 1200.55,
      category: ['Rent'],
    });

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.name, 'Test Rent');

  const transactionId = createRes.body._id;
  assert.ok(transactionId);

  const listRes = await request(app)
    .get('/api/transactions?sortBy=newest')
    .set('Authorization', authHeader);

  assert.equal(listRes.status, 200);
  assert.equal(listRes.body.length, 1);

  const getRes = await request(app)
    .get(`/api/transactions/${transactionId}`)
    .set('Authorization', authHeader);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body._id, transactionId);

  const updateRes = await request(app)
    .patch(`/api/transactions/${transactionId}`)
    .set('Authorization', authHeader)
    .send({ amount: 999.99 });

  assert.equal(updateRes.status, 200);

  const deleteRes = await request(app)
    .delete(`/api/transactions/${transactionId}`)
    .set('Authorization', authHeader);

  assert.equal(deleteRes.status, 200);

  const finalListRes = await request(app)
    .get('/api/transactions')
    .set('Authorization', authHeader);

  assert.equal(finalListRes.status, 200);
  assert.equal(finalListRes.body.length, 0);
});

test('user cannot access another user transaction', async () => {
  const registerUserOne = await request(app)
    .post('/api/user/register')
    .send({ username: 'owner-user', password: 'password123' });
  assert.equal(registerUserOne.status, 201);

  const registerUserTwo = await request(app)
    .post('/api/user/register')
    .send({ username: 'other-user', password: 'password123' });
  assert.equal(registerUserTwo.status, 201);

  const ownerAuth = `Bearer ${registerUserOne.body.token}`;
  const otherAuth = `Bearer ${registerUserTwo.body.token}`;

  const createRes = await request(app)
    .post('/api/transactions')
    .set('Authorization', ownerAuth)
    .send({
      name: 'Owner Transaction',
      type: 'expense',
      amount: 45.5,
      category: ['Food and Drink'],
    });
  assert.equal(createRes.status, 201);

  const transactionId = createRes.body._id;

  const otherGetRes = await request(app)
    .get(`/api/transactions/${transactionId}`)
    .set('Authorization', otherAuth);
  assert.equal(otherGetRes.status, 404);

  const otherUpdateRes = await request(app)
    .patch(`/api/transactions/${transactionId}`)
    .set('Authorization', otherAuth)
    .send({ amount: 10 });
  assert.equal(otherUpdateRes.status, 404);

  const otherDeleteRes = await request(app)
    .delete(`/api/transactions/${transactionId}`)
    .set('Authorization', otherAuth);
  assert.equal(otherDeleteRes.status, 404);

  const ownerGetRes = await request(app)
    .get(`/api/transactions/${transactionId}`)
    .set('Authorization', ownerAuth);
  assert.equal(ownerGetRes.status, 200);
});

test('transaction validation rejects bad payloads', async () => {
  const registerRes = await request(app)
    .post('/api/user/register')
    .send({ username: 'validation-user', password: 'password123' });
  assert.equal(registerRes.status, 201);

  const authHeader = `Bearer ${registerRes.body.token}`;

  const missingFieldsRes = await request(app)
    .post('/api/transactions')
    .set('Authorization', authHeader)
    .send({});
  assert.equal(missingFieldsRes.status, 400);
  assert.deepEqual(
    missingFieldsRes.body.invalidFields.sort(),
    ['amount', 'name', 'type'].sort()
  );

  const invalidTypeRes = await request(app)
    .post('/api/transactions')
    .set('Authorization', authHeader)
    .send({
      name: 'Invalid Type',
      type: 'other',
      amount: 10,
      category: ['Misc'],
    });
  assert.equal(invalidTypeRes.status, 400);
  assert.ok(invalidTypeRes.body.invalidFields.includes('type'));

  const createRes = await request(app)
    .post('/api/transactions')
    .set('Authorization', authHeader)
    .send({
      name: 'Valid Transaction',
      type: 'income',
      amount: 1500,
      category: ['Income'],
    });
  assert.equal(createRes.status, 201);

  const invalidUpdateRes = await request(app)
    .patch(`/api/transactions/${createRes.body._id}`)
    .set('Authorization', authHeader)
    .send({ amount: -10 });
  assert.equal(invalidUpdateRes.status, 400);
  assert.ok(invalidUpdateRes.body.invalidFields.includes('amount'));
});

test('plaid helpers normalize legacy and upsert item records', async () => {
  const legacyUser = {
    access_token: 'legacy-token',
    item_id: ['item-a', 'item-b'],
    plaidCursor: 'legacy-cursor',
    plaidItems: [],
  };

  const normalized = plaidPrivate.normalizeLegacyPlaidItems(legacyUser);
  assert.deepEqual(normalized, [
    { itemId: 'item-a', accessToken: 'legacy-token', cursor: 'legacy-cursor' },
    { itemId: 'item-b', accessToken: 'legacy-token', cursor: 'legacy-cursor' },
  ]);

  const upserted = plaidPrivate.upsertPlaidItem(
    [{ itemId: 'item-a', accessToken: 'old-token', cursor: 'old-cursor' }],
    { itemId: 'item-a', accessToken: 'new-token', cursor: null }
  );

  assert.deepEqual(upserted, [
    { itemId: 'item-a', accessToken: 'new-token', cursor: 'old-cursor' },
  ]);
});

test('plaid sync updates only matching user/item and stores per-item cursor', async () => {
  const userOne = await User.create({
    username: 'plaid-user-one',
    password: 'hashed-password',
    plaidItems: [{ itemId: 'item-1', accessToken: 'token-1', cursor: null }],
  });

  const userTwo = await User.create({
    username: 'plaid-user-two',
    password: 'hashed-password',
    plaidItems: [{ itemId: 'item-2', accessToken: 'token-2', cursor: null }],
  });

  await Transaction.create({
    name: 'Delete Me User One',
    type: 'expense',
    amount: 20,
    userID: userOne._id.toString(),
    plaidTransactionID: 'delete-me',
    date: new Date(),
    category: ['Fees'],
  });

  await Transaction.create({
    name: 'Delete Me User Two',
    type: 'expense',
    amount: 30,
    userID: userTwo._id.toString(),
    plaidTransactionID: 'delete-me',
    date: new Date(),
    category: ['Fees'],
  });

  plaidPrivate.setPlaidClient({
    transactionsSync: async ({ access_token: accessToken }) => {
      if (accessToken !== 'token-1') {
        throw new Error('Unexpected access token in test');
      }
      return {
        data: {
          added: [
            {
              transaction_id: 'new-tx',
              name: 'Coffee Shop',
              amount: 8.5,
              date: '2025-01-11',
              category: ['Food and Drink'],
            },
          ],
          modified: [],
          removed: [{ transaction_id: 'delete-me' }],
          next_cursor: 'cursor-item-1',
          has_more: false,
        },
      };
    },
  });

  const syncResult = await plaidPrivate.syncTransactions(
    { itemId: 'item-1', accessToken: 'token-1', cursor: null },
    userOne._id.toString()
  );

  assert.equal(syncResult.itemId, 'item-1');
  assert.equal(syncResult.added, 1);
  assert.equal(syncResult.removed, 1);

  const deletedForUserOne = await Transaction.findOne({
    userID: userOne._id.toString(),
    plaidTransactionID: 'delete-me',
  });
  assert.equal(deletedForUserOne, null);

  const stillExistsForUserTwo = await Transaction.findOne({
    userID: userTwo._id.toString(),
    plaidTransactionID: 'delete-me',
  });
  assert.ok(stillExistsForUserTwo);

  const createdForUserOne = await Transaction.findOne({
    userID: userOne._id.toString(),
    plaidTransactionID: 'new-tx',
  });
  assert.ok(createdForUserOne);
  assert.equal(createdForUserOne.name, 'Coffee Shop');

  const refreshedUserOne = await User.findById(userOne._id);
  const syncedItem = refreshedUserOne.plaidItems.find((item) => item.itemId === 'item-1');
  assert.equal(syncedItem.cursor, 'cursor-item-1');
});
