export const state = {
  users: [],
  selectedUserId: null,
  posts: [],
  commentsByPostId: {},
  filters: {
    minChars: 0,
    minPosts: 0,
  },
  cache: {
    postsByUser: {},
  },
};
