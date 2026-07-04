import type { ObjectId } from "mongodb";

type ProjectBase<TId> = {
  _id: TId;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = ProjectBase<ObjectId>;
export type ProjectResponse = ProjectBase<string>;
