import { BlogEditor } from "@/components/admin/BlogEditor";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Новая статья</h1>
      <BlogEditor />
    </div>
  );
}
