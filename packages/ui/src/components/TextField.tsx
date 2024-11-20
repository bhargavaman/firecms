"use client";
import React, { useCallback, useEffect, useRef } from "react";

import { TextareaAutosize } from "./TextareaAutosize";
import {
    fieldBackgroundDisabledMixin,
    fieldBackgroundHoverMixin,
    fieldBackgroundInvisibleMixin,
    fieldBackgroundMixin,
    focusedInvisibleMixin,
} from "../styles";
import { InputLabel } from "./InputLabel";
import { cls } from "../util";

export type InputType =
    "text"
    | "number"
    | "phone"
    | "email"
    | "password"
    | "search"
    | "url"
    | "date"
    | "time"
    | "datetime-local"
    | "month"
    | "week"
    | "color";

export type TextFieldProps<T extends string | number> = {
    type?: InputType,
    value?: T,
    onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
    label?: React.ReactNode,
    multiline?: boolean,
    rows?: number,
    disabled?: boolean,
    invisible?: boolean,
    error?: boolean,
    endAdornment?: React.ReactNode,
    autoFocus?: boolean,
    placeholder?: string,
    size?: "small" | "medium" | "large",
    className?: string,
    style?: React.CSSProperties,
    inputClassName?: string,
    inputStyle?: React.CSSProperties,
    inputRef?: React.ForwardedRef<any>
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

export function TextField<T extends string | number>({
                                                         value,
                                                         onChange,
                                                         label,
                                                         type = "text",
                                                         multiline = false,
                                                         invisible,
                                                         rows,
                                                         disabled,
                                                         error,
                                                         endAdornment,
                                                         autoFocus,
                                                         placeholder,
                                                         size = "large",
                                                         className,
                                                         style,
                                                         inputClassName,
                                                         inputStyle,
                                                         inputRef: inputRefProp,
                                                         ...inputProps
                                                     }: TextFieldProps<T>) {

    const inputRef = inputRefProp ?? useRef(null);

    // @ts-ignore
    const [focused, setFocused] = React.useState(document.activeElement === inputRef.current);
    const hasValue = value !== undefined && value !== null && value !== "";

    useEffect(() => {
        if (type !== "number") return;
        const handleWheel = (event: any) => {
            if (event.target instanceof HTMLElement) event.target.blur()
        };

        // Current input element
        const element = "current" in inputRef ? inputRef.current : inputRef;

        // Add the event listener
        element.addEventListener("wheel", handleWheel);

        // Remove event listener on cleanup
        return () => {
            element.removeEventListener("wheel", handleWheel);
        };
    }, [inputRef, type]);

    const numberInputOnWheelPreventChange = useCallback((e: any) => {
        e.preventDefault()
    }, []);

    const input = multiline
        ? <TextareaAutosize
            {...inputProps as any}
            ref={inputRef}
            placeholder={focused || hasValue || !label ? placeholder : undefined}
            autoFocus={autoFocus}
            rows={rows}
            value={value ?? ""}
            onChange={onChange}
            style={inputStyle}
            className={cls(
                invisible ? focusedInvisibleMixin : "",
                "rounded-md resize-none w-full outline-none p-[32px] text-base bg-transparent min-h-[64px] px-3 pt-8",
                disabled && "border border-transparent outline-none opacity-50 text-surface-accent-600 dark:text-surface-accent-500"
            )}
        />
        : <input
            {...inputProps}
            ref={inputRef}
            onWheel={type === "number" ? numberInputOnWheelPreventChange : undefined}
            disabled={disabled}
            style={inputStyle}
            className={cls(
                "w-full outline-none bg-transparent leading-normal px-3",
                "rounded-md",
                invisible ? focusedInvisibleMixin : "",
                disabled ? fieldBackgroundDisabledMixin : fieldBackgroundHoverMixin,
                size === "small" ? "min-h-[32px]" : (size === "medium" ? "min-h-[48px]" : "min-h-[64px]"),
                label ? (size === "large" ? "pt-8 pb-2" : "pt-4 pb-2") : "py-2",
                focused ? "text-text-primary dark:text-text-primary-dark" : "",
                endAdornment ? "pr-10" : "pr-3",
                disabled && "border border-transparent outline-none opacity-50 dark:opacity-50 text-surface-accent-800 dark:text-white",
                inputClassName
            )}
            placeholder={focused || hasValue || !label ? placeholder : undefined}
            autoFocus={autoFocus}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            type={type}
            value={Number.isNaN(value) ? "" : (value ?? "")}
            onChange={onChange}
        />;

    return (
        <div
            className={cls(
                "rounded-md relative max-w-full",
                invisible ? fieldBackgroundInvisibleMixin : fieldBackgroundMixin,
                disabled ? fieldBackgroundDisabledMixin : fieldBackgroundHoverMixin,
                error ? "border border-red-500 dark:border-red-600" : "",
                {
                    "min-h-[32px]": !invisible && size === "small",
                    "min-h-[48px]": !invisible && size === "medium",
                    "min-h-[64px]": !invisible && size === "large"
                },
                className)}
            style={style}>

            {label && (
                <InputLabel
                    className={cls(
                        "pointer-events-none absolute",
                        size === "large" ? "top-1" : "-top-1",
                        !error ? (focused ? "text-primary dark:text-primary" : "text-text-secondary dark:text-text-secondary-dark") : "text-red-500 dark:text-red-600",
                        disabled ? "opacity-50" : "")}
                    shrink={hasValue || focused}
                >
                    {label}
                </InputLabel>
            )}

            {input}

            {endAdornment && <div
                className="flex flex-row justify-center items-center absolute h-full right-0 top-0 mr-4 ">{endAdornment}</div>}

        </div>
    );
}
