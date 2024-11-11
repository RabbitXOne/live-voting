Aby wykorzystać ciasteczka, localStorage oraz tokeny jednorazowe do sprawdzania, czy użytkownik już zagłosował, możesz zmodyfikować swój kod w page.js w następujący sposób:

Sprawdź przy ładowaniu strony, czy użytkownik już głosował:

```javascript
useEffect(() => {
    const initialize = async () => {
        // Sprawdź localStorage
        if (localStorage.getItem('hasVoted') === 'true') {
            setMode("alreadyVoted");
            return;
        }

        // Sprawdź ciasteczka
        const hasVotedCookie = document.cookie.split(';').some((item) => item.trim().startsWith('hasVoted='));
        if (hasVotedCookie) {
            setMode("alreadyVoted");
            return;
        }

        // Kontynuuj z istniejącym kodem
        fetch(`/api/gethomepage`)
            .then(response => response.json())
            .then(data => {
                setTitle(data.title);
                setFooter(data.footer);
                setRegisterBtn_name(data.registerBtn_name);
                setMode(data.mode);
                setVoteButtons(data.votingoptions);
                setTabTitle(data.tabTitle);

                setFadeOut(true);
                setTimeout(() => {
                    setLoading(false);
                }, 200);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                // Obsługa błędów
            });

        // Sprawdź token jednorazowy
        const voterId = localStorage.getItem('voterId');
        if (voterId) {
            fetch(`/api/checkvote?voterId=${voterId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.alreadyVoted) {
                        setMode("alreadyVoted");
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    // Obsługa błędów
                });
        }
    };

    initialize();
}, []);
```
2. Po oddaniu głosu ustawiaj flagi w localStorage i ciasteczkach:
```javascript
// Po udanym głosowaniu
localStorage.setItem('hasVoted', 'true');
document.cookie = "hasVoted=true; max-age=31536000; path=/"; // Ciasteczko ważne przez rok
```

3. Generuj i przechowuj token jednorazowy (voterId):
Jeśli jeszcze nie masz voterId w localStorage, wygeneruj go:
```javascript
if (!localStorage.getItem('voterId')) {
    const voterId = generateVoterId(); // Funkcja generująca unikalny ID
    localStorage.setItem('voterId', voterId);
}
```

Funkcja do generowania voterId:
```javascript
function generateVoterId() {
    return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

4. W API sprawdzaj voterId:
W endpointzie /api/checkvote zmodyfikuj kod, aby sprawdzał, czy voterId istnieje w bazie danych i czy użytkownik już głosował:
```javascript
export async function GET(request) {
    try {
        const url = new URL(request.url);
        const voterId = url.searchParams.get('voterId');
        const q = db.collection('voters').where('voterId', '==', voterId);
        const querySnapshot = await q.get();

        let dataSend = { alreadyVoted: false };

        if (!querySnapshot.empty) {
            dataSend.alreadyVoted = true;
        }

        return new Response(JSON.stringify(dataSend), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

5. Podczas głosowania zapisuj voterId w bazie danych:
Przy zapisywaniu głosu dodaj voterId do dokumentu:
```javascript
// Przykład zapisu głosu w Firestore
db.collection('voters').add({
    voterId: voterId,
    vote: selectedOption,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
});
```

Uwagi:

Bezpieczeństwo: Pamiętaj, że localStorage i ciasteczka mogą być modyfikowane przez użytkownika. Używanie tokenów jednorazowych (voterId) i weryfikacja po stronie serwera zwiększa bezpieczeństwo.

Ograniczenia: Użytkownicy mogą próbować obejść zabezpieczenia, czyszcząc dane przeglądarki lub używając trybu incognito. W kontekście głosowania w jednej lokalizacji fizycznej może to być akceptowalne.

Spójność: Upewnij się, że wszystkie miejsca w kodzie, gdzie sprawdzany jest stan głosowania, uwzględniają nowe metody przechowywania i weryfikacji.

W ten sposób wykorzystasz ciasteczka, localStorage oraz tokeny jednorazowe do efektywnego sprawdzania, czy użytkownik już zagłosował.