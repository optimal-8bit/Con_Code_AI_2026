export default function ReminderCard({ reminder }) {
  return (
    <div className="rounded-xl border border-white/15 bg-background/35 p-3 text-sm shadow-sm backdrop-blur-md">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{reminder.medicine_name}</p>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
          {reminder.time}
        </span>
      </div>
      <p className="text-muted-foreground">{reminder.dosage || "Dosage not specified"}</p>
      <p className="mt-1 text-foreground/85">{reminder.instructions || "No extra instructions"}</p>
      <p className="mt-1 text-xs text-muted-foreground">Timezone: {reminder.timezone || "UTC"}</p>
    </div>
  );
}
