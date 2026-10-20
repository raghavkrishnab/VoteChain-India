# Demo voters

Five fictional voters for demonstrating VoteChain India. The faces are **AI-generated people who do not exist** (from thispersondoesnotexist.com), and every name, date and email is made up. The ID cards are marked "SPECIMEN — NOT A GOVERNMENT ID".

| # | Name | Gender | Date of birth | Voter ID | Email | Expected result |
|---|---|---|---|---|---|---|
| 1 | Ananya Sharma | Female | 12 MAR 1978 | VCI-DEMO-0001 | ananya.sharma@example.com | Eligible |
| 2 | Priya Menon | Female | 25 JUL 1981 | VCI-DEMO-0002 | priya.menon@example.com | Eligible |
| 3 | Samuel D'Souza | Male | 03 SEP 1976 | VCI-DEMO-0003 | samuel.dsouza@example.com | Eligible |
| 4 | Karan Mehta | Male | 09 NOV 1994 | VCI-DEMO-0004 | karan.mehta@example.com | Eligible |
| 5 | Isha Kapoor | Female | 14 FEB 2010 | VCI-DEMO-0005 | isha.kapoor@example.com | **Not eligible** (under 18) |

Each folder contains:

| File | Use it for |
|---|---|
| `voter-id-card.png` | **Register** → "Demo ID document" |
| `reference-face.jpg` | **Register** → "Reference face photo" |
| `live-selfie.jpg` | **Verify** → upload as the live photo (a zoomed, tilted, re-lit version of the same face) |

## Registering one of them

1. In MetaMask, create a separate account for each demo voter (account menu → **Add account**). Never use the admin account as a voter.
2. Open http://localhost:5173/register. Enter the name, email and voter ID from the table, and any password of 8+ characters.
3. Click **Connect** with that voter's MetaMask account selected, then upload the card and reference face.
4. Sign in as the voter, open **Verify**, choose "upload" and pick `live-selfie.jpg`.
5. Switch MetaMask to the admin account and click **Register & approve** for the voter on the Admin page. Voter 5 can't be approved, because she fails the age check, which is the point of the demo.

## Tested results

Run through the real AI service (InsightFace + Tesseract):

- **Matching selfies:** face similarity 0.88–0.93 against the 0.45 threshold, so all are accepted.
- **Dates of birth:** read correctly from every card.
- **Ages:** voters 1–4 are eligible; voter 5 (age 16) is not.
- **Impostors** (one person's selfie against another's registered face): similarity 0.07–0.27, so all are rejected.
