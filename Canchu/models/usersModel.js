//require the mysql package and create a MySQL connection
const mysql = require('mysql2'); //mysql
const cacheUtils = require("../utils/cacheUtils");

//import dotenv from 'dotenv'
const dotenv = require('dotenv');
dotenv.config()

//import bcrypt from 'bcryptjs'
//const bcrypt = require('bcrypt');

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,//'canchu_mysql'// 資料庫主機位址
  user: process.env.MYSQL_USER,//'root'// 資料庫使用者名稱
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});
exports.connection = connection;


// Connect to MySQL
connection.connect((err) => {
  if (err) {
    throw new Error('Error connecting to MySQL: ' + err.message);
    return;
  }
  console.log('Connected to MySQL server');
});

// ------USERMODELS------
/*
// Check Email and Insert User
exports.checkEmailAndInsertUser = (name, email, password) => {
    return new Promise((resolve, reject) => {
        const checkEmailQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
        connection.query(checkEmailQuery, [email], (error, results) => {
          if (error) {
            reject(error);
            return;
          }
    
          const emailExists = results[0].count > 0;
    
          if (emailExists) {
            const error = new Error('Email already exists');
            error.status = 403;
            reject(error);
            return;
          }
    
          const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
          connection.query(insertUserQuery, [name, email, password], (err) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
      });
};*/

// Check if the email exists in the database
exports.checkEmailExists = (email) => {
  return new Promise((resolve, reject) => {
    const checkEmailQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
    connection.query(checkEmailQuery, [email], (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      const emailExists = results[0].count > 0;

      resolve(emailExists);
    });
  });
};

// Insert a new user into the database
exports.insertUser = (name, email, password) => {
  return new Promise((resolve, reject) => {
    const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    connection.query(insertUserQuery, [name, email, password], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Validate Native Credentials
exports.validateNativeCredentials = (email, password) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT id, name, picture FROM users WHERE email = ? AND password = ?;';
        const params = [email, password];
        connection.query(query, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
    
          // Close the database connection
          //connection.end();
        });
      });
};

// Get User Profile by ID
exports.getUserProfileById = async(searchUserId, userId, status) => {
  try {
    const executeQuery = (query, params) => {
      return new Promise((resolve, reject) => {
        connection.query(query, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    };

    const getProfileDetail = async (searchUserId) => {
      const cacheKey = `user_profile_${searchUserId}`;
      let profileDetail ;//= await cacheUtils.getFromCache(cacheKey);
      if (!profileDetail) {
        const query =
          'SELECT id, name, picture, introduction, tags \
        FROM users \
        WHERE id = ?';
        const params = [searchUserId];
        profileDetail = await executeQuery(query, params);

        // Set data in Redis cache for future use
        //cacheUtils.setInCache(cacheKey, profileDetail, 3600);
      }
      return profileDetail;
    };

    const getFriendCount = async (searchUserId) => {
      const cacheKey = `user_friendCount_${searchUserId}`;
      let count ;//= await cacheUtils.getFromCache(cacheKey);
      if (!count) {
        const query = 'SELECT COUNT(*) FROM `friendship` WHERE (`user1_id` = ? Or `user2_id` = ?) AND `status` = ?';
        const params = [searchUserId, searchUserId, status];
        const results = await executeQuery(query, params);
        count = results[0]['COUNT(*)']
        
        // Set data in Redis cache for future use
        //cacheUtils.setInCache(cacheKey, count, 3600);
      }
      return count;
    };

    const getFriendship = async (userId, searchUserId) => {
      const query = 'SELECT id, user1_id, status FROM `friendship` \
      WHERE (`user1_id` = ? AND `user2_id` = ?) OR (`user1_id` = ? AND `user2_id` = ?)';
      const params = [userId, searchUserId, searchUserId, userId];
      const results = await executeQuery(query, params);
      if(results.length > 0 && results[0].user1_id == searchUserId && results[0].status == "requested"){
        results[0].status = "pending";
      }
      return results;
    };

    const ProfileDetail = await getProfileDetail(searchUserId);
    const FriendCount = await getFriendCount(searchUserId, status);
    const Friendship = await getFriendship(userId, searchUserId);

    return {
      ProfileDetail,
      FriendCount,
      Friendship,
    };
  } catch (error) {
    throw new Error('An error occurred during processing profile details.');
  }
};


// Find by Id and Update User
exports.findByIdAndUpdate = (userid, updateData) => {
    const { name, introduction, tags } = updateData;
    const query = 'UPDATE users SET name = ?, introduction = ?, tags = ? WHERE id = ?';
    const params = [name, introduction, tags, userid];

    return new Promise((resolve, reject) => {
      connection.query(query, params, async (error, results) => {
        if (error) {
          reject(error);
        } else {
          // Invalidate the cache for the updated user profile
          const cacheKey = `user_profile_${userid}`;
          try {
            await cacheUtils.invalidateCache(cacheKey);
          } catch (err) {
            console.error("Error clearing cache:", err);
          }
          //console.log(userid);
          resolve(userid);
        }
      });
    });
};

// Search Keyword
exports.searchByKeyword = (userId,keyword) => {
  return new Promise((resolve, reject) => {
      const query = 'SELECT users.id, users.name, users.picture, friendship.id AS friendId, friendship.status \
      FROM users \
      LEFT JOIN friendship\
      ON (friendship.user1_id = users.id AND friendship.user2_id = ?) OR (friendship.user2_id = users.id AND friendship.user1_id = ?) WHERE users.name = ?;';
      //ON users.id = friendship.user_id WHERE users.name LIKE '+`'%${keyword}%'`;
      connection.query(query, [userId, userId, keyword], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
};

//Update picture URL
exports.pictureUpdate = (imageUrl, userId) => {
  const query = 'UPDATE users SET picture = ? WHERE id = ?';
  const params = [imageUrl, userId];
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};