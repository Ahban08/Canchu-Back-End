const request = require('supertest');
const usersController = require('../controller/usersController');  
const jwt = require('jsonwebtoken');
const usersModel = require('../models/usersModel');
jest.useFakeTimers()

/*test('adds 1 + 2 to equal 3', async() => {
  await expect(usersController.sum(1, 2)).toBe(3);
});*/



jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked_access_token'),
}));

// Mock the usersModel and its methods
jest.mock('../models/usersModel', () => ({
  checkEmailExists: jest.fn(),
  insertUser: jest.fn(),
}));

describe('User Sign Up', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        name: 'ahban',
        email: 'ahban@example.com',
        password: 'some_password',
      },
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should sign up user and return access token and user data', async () => {
    // Mock checkEmailExists to return false (user does not exist)
    usersModel.checkEmailExists.mockResolvedValue(false);

    // Mock insertUser to return the inserted user data
    usersModel.insertUser.mockResolvedValue({ insertId: 1 });
    await usersController.signup(req, res);

    expect(usersModel.checkEmailExists).toHaveBeenCalledWith(
      'ahban@example.com'
    );

    expect(usersModel.insertUser).toHaveBeenCalledWith(
      'ahban',
      'ahban@example.com',
      'some_password'
    );

    expect(jwt.sign).toHaveBeenCalledWith(
      { email: 'ahban@example.com', name: 'ahban' },
      process.env.SECRET,
      { expiresIn: '8h' }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        access_token: 'mocked_access_token',
        user: {
          id: 1,
          provider: 'native',
          name: 'ahban',
          email: 'ahban@example.com',
          picture: 'PictureURL',
        },
      },
    });
  });

  test('should return error when missing required fields', async () => {
    req.body.name = undefined;
    await usersController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'All fields must be entered.',
    });
  });

  test('should return error when email format is invalid', async () => {
    req.body.email = 'invalid_email';
    await usersController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid email address.',
    });
  });

  test('should return error when user already exists', async () => {
    // Mock the rejected promise for duplicate email
    usersModel.checkEmailExists.mockResolvedValue(true);

    await usersController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email already exists',
    });
  });

  test('should return error for internal server error', async () => {
    // Mock the rejected promise for internal server error
    usersModel.checkEmailExists.mockRejectedValue(new Error('Some error'));

    await usersController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });
});
