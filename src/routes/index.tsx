import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Ready for New System
        </h1>
        <p className="mt-4 text-gray-600">
          Everything has been deleted. Send your new requirements to start building!
        </p>
      </div>
    </div>
  );
}
