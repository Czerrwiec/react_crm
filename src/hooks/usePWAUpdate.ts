import { useEffect } from 'react';

export function usePWAUpdate() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                // Sprawdzaj co godzinę
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            });

            // Nasłuchuj na aktualizacje
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (window.confirm('Dostępna jest nowa wersja aplikacji. Czy chcesz zaktualizować teraz?')) {
                    window.location.reload();
                }
            });
        }
    }, []);

    return null;
}