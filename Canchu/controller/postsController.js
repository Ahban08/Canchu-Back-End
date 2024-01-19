const postsModel = require('../models/postsModel');
const base64Util = require('../utils/base64Utils');

//Set Timezone
const moment = require('moment-timezone'); 
moment.tz.setDefault("Asia/Taipei");

//Create Post
exports.createPost = (req, res) => {
  const {context} = req.body;
  //const contex = req.body.context;
  const userId = req.decodedToken.id;
  if(context){
    postsModel.insertPost(context, userId)
    .then(results => {
      const response = {
        data: {
          post: {
            id: results.insertId
          }
        }
      };
      res.status(200).json(response);
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    });
  }else {
    // Handle the case where context is empty
    res.status(400).json({ error: 'Context is empty.' });
  }
  
};

//Update Post
exports.updatePost = (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.decodedToken.id;
  const {context} = req.body;
  if (!isNaN(postId)) {
    // Check if the post id is valid and exists in the system
    if(context){
      postsModel.findPostByIdAndUpdate(context, postId, userId)
        .then(results => {
          if (results.affectedRows == 0) {
            res.status(400).json({ error: 'Post does not exist or user has no permission.' });
          } else {
                const response = {
                  data: {
                    post: {
                      id: postId
                    }
                  }
                };
                res.status(200).json(response);
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
    }else {
      // Handle the case where context is empty
      res.status(400).json({ error: 'Context is empty.' });
    }    
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid post ID' });
  }

};

//Like
exports.createLike = (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.decodedToken.id;
  if (!isNaN(postId)) {
      postsModel.checkPostLike(postId, userId)
        .then(count => {
          //console.log(count);
          if (count > 0) {
            res.status(400).json({ error: 'Already liked!' });
          } else {
            postsModel.insertPostLike(postId, userId)
              .then(results => {
                /*if(postId == userId)
                {
                  postsModel.updateIsLiked(TRUE, postId, userId)
                  .catch(error => {
                    console.error(error);
                    res.status(500).json({ error: 'Server error' });
                  });
                }*/
                const response = {
                  data: {
                    post: {
                      id: postId
                    }
                  }
                };
                res.status(200).json(response);
              })
              .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
              });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid post ID' });
  }

};

//Delete Like
exports.deleteLike = (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.decodedToken.id;
  if (!isNaN(postId)) {
      postsModel.checkPostLike(postId, userId)
        .then(count => {
          if (count == 0) {
            res.status(400).json({ error: 'Not liked yet' });
          } else {
            postsModel.deletePostLike(postId, userId)
              .then(results => {
                
                const response = {
                  data: {
                    post: {
                      id: postId
                    }
                  }
                };
                res.status(200).json(response);
              })
              .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
              });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid post ID' });
  }
};

//Comment
exports.createComment = (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const {content} = req.body;
  const userId = req.decodedToken.id;
  if (!isNaN(postId)) {
    if(content){
      postsModel.checkPostExist(postId)
        .then(count => {
          if (count == 0) {
            res.status(400).json({ error: 'Invalid post ID' });
          } else {
            postsModel.insertPostComment(content, postId, userId)
              .then(results => {
                const response = {
                  data: {
                    post: {
                      id: postId
                    },
                    comment: {
                      id: results.insertId
                    }
                  }
                };
                res.status(200).json(response);
              })
              .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
              });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
    }else {
      // Handle the case where context is empty
      res.status(400).json({ error: 'content is empty.' });
    }
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid post ID' });
  }

};

// Get Detail
exports.getDetail = (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.decodedToken.id;
  if (!isNaN(postId)) {
    postsModel.checkPostExist(postId)
        .then(count => {
          if (count == 0) {
            res.status(400).json({ error: 'Invalid post ID' });
          } else {
            postsModel.processPostDetails(postId, userId)
              .then(results => {
                postsModel.getComment(postId)
                .then(commentList => {
                  const promises = commentList.map(async result => {
                    const commemtTaipeiDateTime = moment.utc(result.created_at).tz('Asia/Taipei');
                    const commemtFormattedDateTime = commemtTaipeiDateTime.format('YYYY-MM-DD HH:mm:ss');
                    const content = {
                      id: result.comment_id,
                      created_at:  commemtFormattedDateTime,
                      content: result.content,
                      user: {
                        id: result.user_id,
                        name: result.name,
                        picture: result.picture
                      }
                    };
                    return content;
                  });
                  Promise.all(promises)
                    .then(comments => {
                      const taipeiDateTime = moment.utc(results.PostDetail[0].created_at).tz('Asia/Taipei');
                      const formattedDateTime = taipeiDateTime.format('YYYY-MM-DD HH:mm:ss');
                      const response = {
                        data: {
                          post: {
                            id: postId,
                            created_at: formattedDateTime,
                            context: results.PostDetail[0].context,
                            is_liked: results.isLiked,
                            like_count: results.likeCount,
                            comment_count: results.commentCount,
                            picture: results.PostDetail[0].picture,
                            name: results.PostDetail[0].name,
                            user_id:results.PostDetail[0].userId,
                            comments :comments
                          }
                        }
                      };
                      console.log(response);
                      res.status(200).json( response );
                    })
                    .catch(error => {
                      console.error(error);
                      res.status(500).json({ error: 'Server error' });
                    });
                })
                .catch(error => {
                  console.error(error);
                  res.status(500).json({ error: 'Server error' });
                });

              })
              .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
              });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid post ID' });
  }

};

// Search Detail
exports.search = (req, res) => {
  const searchUserId = req.query.user_id;
  const cursor = req.query.cursor;
  const userId = req.decodedToken.id;
  // Decode the cursor parameter if provided
  const decodedCursor = cursor ? base64Util.decodeBase64(cursor) : null;
  if(isNaN( decodedCursor)){
			res.status(400).send(JSON.stringify({"error":"Invalid cursor"}));
      return;
  }

  postsModel.searchByUserIdOrCursor(userId, searchUserId, decodedCursor, 10)
    .then(postListAndNextCursor => {
        const promises = postListAndNextCursor.results.map(async postResult => {
          try {
          const results = await postsModel.processPostDetails(postResult.id, userId);
          const taipeiDateTime = moment.utc(results.PostDetail[0].created_at).tz('Asia/Taipei');
          const formattedDateTime = taipeiDateTime.format('YYYY-MM-DD HH:mm:ss');
          const content = {
            id: postResult.id,
            user_id: results.PostDetail[0].userId,
            created_at: formattedDateTime,
            context: results.PostDetail[0].context,
            is_liked: results.isLiked,
            like_count: results.likeCount,
            comment_count: results.commentCount,
            picture: results.PostDetail[0].picture,
            name: results.PostDetail[0].name,
          };
          return content;
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Server error' });
        }
      });
      const nextCursor = postListAndNextCursor.nextCursor;
      const encodeCursor = nextCursor ? base64Util.encodeBase64(nextCursor.toString()) : null;
      Promise.all(promises)
        .then(postsResult => {
          const response = {
            data: {
              posts: postsResult,
              next_cursor: encodeCursor
            },
          };
          res.status(200).json(response);
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });

    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    });

};