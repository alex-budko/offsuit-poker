const suits = ["s", "d", "c", "h"];
const faceValues = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
];

let deck = []

// create a deck of cards
for (let suit = 0; suit < suits.length; suit++) {
    for (let faceValue = 0; faceValue < faceValues.length; faceValue++) {
        let card = `${faceValues[faceValue]}${suits[suit]}`
        deck.push(card);
    }
}

export default deck