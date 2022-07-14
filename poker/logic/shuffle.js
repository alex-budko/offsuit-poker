// Fisher–Yates shuffle
const shuffle = (deck) => {

    let shuffledDeck = []

    while (deck.length !== 0) {
        let n = Math.floor(Math.random() * deck.length)
        let currentCard = deck.splice(n, 1)
        shuffledDeck.push(currentCard[0])
    }

    return shuffledDeck
}

export default shuffle;