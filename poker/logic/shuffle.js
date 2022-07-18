// Fisher–Yates shuffle
const shuffle = (d) => {

    let deck = [...d]

    let shuffledDeck = []

    while (deck.length !== 0) {
        let n = Math.floor(Math.random() * deck.length)
        let currentCard = deck.splice(n, 1)
        shuffledDeck.push(currentCard[0])
    }

    return shuffledDeck
}

export default shuffle;