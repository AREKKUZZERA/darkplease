import {m} from 'malevic';

export default function CheckmarkIcon({isChecked}: {isChecked: boolean}) {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            />
            {isChecked ? (
                <path
                    d="M5.3 8.2 L7.1 10 L10.8 6.3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            ) : (
                <path
                    d="M6 6 L10 10 M10 6 L6 10"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                />
            )}
        </svg>
    );
}
