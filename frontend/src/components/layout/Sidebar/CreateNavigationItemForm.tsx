import { Plus } from "lucide-react";

type CreateNavigationItemFormProps = {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function CreateNavigationItemForm({ value, placeholder, ariaLabel, onChange, onSubmit }: CreateNavigationItemFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex gap-2 pt-2"
    >
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mini-field" />
      <button type="submit" className="icon-button" aria-label={ariaLabel}>
        <Plus className="size-4" />
      </button>
    </form>
  );
}
