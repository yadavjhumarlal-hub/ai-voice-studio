# AI Voice Studio — Azure Speech F0

Python 3.10+ रखें.
1. `pip install -r requirements.txt`
2. `.env.example` की copy बनाकर `.env` नाम रखें.
3. `.env` में Azure Speech KEY 1 डालें; region `centralindia` रखें.
4. `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Browser में `http://127.0.0.1:8000` खोलें.

API key किसी को share न करें और public GitHub पर upload न करें.

यह build F0 setup के लिए Hindi Standard Neural voices का उपयोग करता है: Arjun, Madhur, Rehaan, Aarav, Kavya, Swara, Ananya, Aarti, Kunal. MAI Voice 2 अधिक expressive है, लेकिन उसकी tier/availability अलग हो सकती है.
