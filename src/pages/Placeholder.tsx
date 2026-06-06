interface Props {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: Props) {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm mt-1">
        {description ?? "Esta funcionalidade será implementada nas próximas fases."}
      </p>
    </div>
  );
}
