//require the mysql package and create a MySQL connection
const mysql = require('mysql2/promise'); //mysql

//import dotenv from 'dotenv'
const dotenv = require('dotenv');
dotenv.config()

//import bcrypt from 'bcryptjs'
//const bcrypt = require('bcrypt');

// Create a MySQL connection
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Connect to MySQL
const executeQuery = async (query, params) => {
  const connection = await pool.getConnection();
  try {
    const [rows, fields] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    throw error;
  } 
};

//------POSTSMODELS------
//create new post
exports.insertPost = async (context, userId) => {
  const query = 'INSERT INTO posts (context, user_id) VALUES (?, ?)';
  const params = [context, userId];
  try {
    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
};

exports.findPostByIdAndUpdate = async (context, postId, userId) => {
  const query = 'UPDATE posts SET context = ? WHERE id = ? AND user_id = ?';
  const params = [context, postId, userId];
  try {
    const results = await executeQuery(query, params);
    //console.log(results);
    return results;
  } catch (error) {
    throw error;
  }
};

//Post like check
exports.checkPostLike = async (postId, userId) => {
  const query = 'SELECT COUNT(*) AS count FROM likes WHERE post_id = ? AND user_id = ?';
  const params = [postId, userId];
  try {
    const results = await executeQuery(query, params);
    const count = results[0].count;
    return count;
  } catch (error) {
    throw error;
  }
};

//Post like insert
exports.insertPostLike = async (postId, userId) => {
  const query = 'INSERT INTO likes (post_id, user_id) VALUES (?, ?)';
  const params = [postId, userId];
  try {
    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
};

//Post like delete
exports.deletePostLike = async (postId, userId) => {
  const query = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
  const params = [postId, userId];
  try {
    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
};

//Post check
exports.checkPostExist = async (postId) => {
  const query = 'SELECT COUNT(*) AS count FROM posts WHERE id = ?';
  const params = [postId];
  try {
    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
};

//Post like insert
exports.insertPostComment = async (context, postId, userId) => {
  const query = 'INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)';
  const params = [context, postId, userId];
  try {
    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
};

exports.processPostDetails = async (postId, userId) => {
  try {

    const getPostDetail = async (postId) => {
      const query = 'SELECT u.id AS userId, u.name, u.picture, p.id, DATE_FORMAT(p.created_at, "%Y-%m-%d %H:%i:%s") AS created_at, p.context \
        FROM users u \
        INNER JOIN posts p ON u.id = p.user_id \
        WHERE p.id = ?';
      const params = [postId];
      const results = await executeQuery(query, params);
      return results;
    };

    const calculateIsLiked = async (postId, userId) => {
      const query = 'SELECT EXISTS (SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?) AS isLiked';
      const params = [postId, userId];
      const results = await executeQuery(query, params);
      return results[0].isLiked === 1;
    };

    const calculateLikeCount = async (postId) => {
      const query = 'SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ?';
      const params = [postId];
      const results = await executeQuery(query, params);
      return results[0].likeCount;
    };

    const calculateCommentCount = async (postId) => {
      const query = 'SELECT COUNT(*) AS commentCount FROM comments WHERE post_id = ?';
      const params = [postId];
      const results = await executeQuery(query, params);
      return results[0].commentCount;
    };

    const PostDetail = await getPostDetail(postId);
    const isLiked = await calculateIsLiked(postId, userId);
    const likeCount = await calculateLikeCount(postId);
    const commentCount = await calculateCommentCount(postId);

    return {
      PostDetail,
      isLiked,
      likeCount,
      commentCount,
    };
  } catch (error) {
    throw new Error('An error occurred during processing post details.');
  }
};


exports.getComment = async (postId) => {
  const query = 'SELECT u.id AS user_id, u.name, u.picture, c.id AS comment_id, DATE_FORMAT(c.created_at, "%Y-%m-%d %H:%i:%s") AS created_at, c.content \
    FROM users u \
    INNER JOIN comments c ON u.id = c.user_id \
    WHERE c.post_id = ?';
  const params = [postId];
  try {
    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
};

// Search Keyword
exports.searchByUserIdOrCursor = async (userId, searchUserId, cursor, limit) => {
    let query, params;
    let nextCursor = null;
    //ORDER BY p.id DESC: show newest posts
    if(searchUserId == undefined && cursor == undefined){
      //show all users' posts and their friends' posts 
      query = `SELECT p.id FROM posts p\
      WHERE p.user_id = ? OR p.user_id IN (\
        SELECT CASE\
          WHEN user1_id = ? THEN user2_id\
          ELSE user1_id\
        END AS friend_id\
        FROM friendship\
        WHERE (user1_id = ? OR user2_id = ?) AND status = 'friend'\
      )\
      ORDER BY p.id DESC LIMIT ?`;
      params = [userId, userId, userId, userId, limit];
    }else if(searchUserId == undefined){
      //filter by cursor
      query = `SELECT p.id FROM posts p\
      WHERE p.id < ? AND (p.user_id = ? OR p.user_id IN (\
        SELECT CASE\
          WHEN user1_id = ? THEN user2_id\
          ELSE user1_id\
        END AS friend_id\
        FROM friendship\
        WHERE (user1_id = ? OR user2_id = ?) AND status = 'friend'\
      ))\
      ORDER BY p.id DESC LIMIT ?`;
      params = [cursor, userId, userId, userId, userId, limit];
    }else if(cursor == undefined){
      //filter by searchUserId
      query = `SELECT p.id FROM posts p\
      WHERE p.user_id = ? \
      ORDER BY p.id DESC LIMIT ?`;
      params = [searchUserId, limit];
    }else{
      //filter by searchUserId & cursor
      query = 'SELECT id FROM posts \
      WHERE id < ? AND user_id = ?\
      ORDER BY id DESC LIMIT ?';
      params = [cursor, searchUserId, limit];
    }
    try {
      const results = await executeQuery(query, params);
      if (results.length < limit) {
        // No more data
        nextCursor = null;
      } else {
        const lastPostId = results[results.length - 1].id;
        nextCursor = lastPostId;
      }
      return { results, nextCursor };
    } catch (error) {
      throw error;
    }
};
