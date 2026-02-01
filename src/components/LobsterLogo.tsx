/* eslint-disable @next/next/no-img-element */
export function LobsterLogo({ className = "w-8 h-8" }: { className?: string, classNamePath?: string }) {
    return (
        <img
            src="/mixed.jpg"
            alt="Molt Battle Logo"
            className={className}
        />
    )
}
