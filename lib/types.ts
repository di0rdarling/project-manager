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

type NoteBase<TId> = {
  _id: TId;
  projectId: TId;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = NoteBase<ObjectId>;
export type NoteResponse = NoteBase<string>;
