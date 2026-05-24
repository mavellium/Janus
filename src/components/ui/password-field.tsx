"use client";

import { useState, useRef } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const rand = (set: string) => set[Math.floor(Math.random() * set.length)];
  const required = [rand(upper), rand(lower), rand(digits), rand(symbols)];
  const rest = Array.from({ length: 8 }, () => rand(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

interface PasswordFieldProps {
  name: string;
  required?: boolean;
  placeholder?: string;
}

export function PasswordField({ name, required, placeholder }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleGenerate() {
    const pwd = generatePassword();
    setValue(pwd);
    setShow(true);
    inputRef.current?.focus();
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          name={name}
          type={show ? "text" : "password"}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        className="h-10 px-3 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition flex items-center gap-1.5 text-xs font-medium shrink-0"
        title="Gerar senha segura"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Gerar
      </button>
    </div>
  );
}
