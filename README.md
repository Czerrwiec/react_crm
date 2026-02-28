--------------------------------------------------------
--------------------------------------------------------

- Projekt systemu CRM (React - Supabase - Vercel Hosting) do zarządzania szkołą jazdy
- Projekt jest faktycznie używany przez szkołę nauki jazdy w małym mieście, stworzony/utrzymywany wyłącznie przez mnie w pojedynkę
--------------------------------------------------------
--------------------------------------------------------

Kolejnym krokiem jest wprowadzenie testów e2e w Playwright (celowo, bo w pracy piszę w Cypressie), testy zostały zainicjalizowane i są
triggerowane każdym pushem do mastera, który jest hostowany na domenie testowej Vercel (chronionej kluczem)

- Testy lecą przez tailscale na prywatny Ubuntu Server podpięty pod domową sieć

- Aplikacja musi zostać cała przetestowana e2e z braku czasu na klikanie manualne przy pracy i dwójce dzieci :D 
- Póki co została stworzona jedynie podstawowa struktura, flow i kilka testów żeby przetestować flow

---------------------------------------------------------
---------------------------------------------------------

Z tego tytułu, że w tej aplikacji front robi to co powinien robić BE, w natępnych krokach postaram się również utworzyć własne API jako przelotka
Supabase - api - Dummy Front (co by front nie musiał mielić tyle danych)
- skutkować to będzie możliwością rozpisania również testów API w Playwright (oby)

