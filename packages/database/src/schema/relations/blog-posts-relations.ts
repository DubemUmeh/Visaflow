import { relations } from "drizzle-orm";
import { blogPosts } from "../tables/blog-posts";
import { users } from "../tables/users";

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));