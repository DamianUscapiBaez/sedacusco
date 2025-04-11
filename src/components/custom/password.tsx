import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BsEye, BsEyeSlash } from "react-icons/bs"; // Importar los íconos de React Icons

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput: React.ForwardRefRenderFunction<HTMLInputElement, PasswordInputProps> = (
    { className, ...props },
    ref
) => {
    const [inputType, setInputType] = useState<"password" | "text">("password");

    const togglePasswordVisibility = () => {
        setInputType((prevType) => (prevType === "password" ? "text" : "password"));
    };

    return (
        <div className="relative">
            <input
                type={inputType}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 py-2 bg-transparent rounded-r-md text-gray-700"
                onClick={togglePasswordVisibility}
            >
                {inputType === "password" ? <BsEyeSlash  /> : <BsEye />}
            </button>
        </div>
    );
};

export default React.forwardRef(PasswordInput);