// 狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}


const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png',// 紅心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png',// 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png', //梅花
]

const view = {
  // 將原本的內容只剩下被面，並給予每張卡片一個索引值
  getCardElement(index) {
    return `<div class="card back" data-index="${index}"></div>`
  },

  // 將原本的卡片內容作區隔，點擊的時候才會加入畫面
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]

    return `
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>
    `
  },


  // 1、11~13 撲克牌花色個別處理
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },


  // 將52張卡片渲染至畫面
  displayCards(indexes) {
    const rootDisplayCard = document.querySelector('#cards')
    rootDisplayCard.innerHTML = indexes.map(index => this.getCardElement(index)).join('');
  },


  // 翻牌邏輯
  filpCards(...cards) {
    // 如果是背面則回傳正面
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 如果是正面則回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },


  // 配對成功時改變的圖示
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  // 分數畫面
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`;
  },

  // 次數畫面
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },


  // 加入關鍵影格
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationed', event =>
        event.traget.classList.remove('wrong'), { once: true })
    })
  },

  // 遊戲結束畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  },
}

// 外來的洗牌(隨機)邏輯，擺外面
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

// 宣告 Model
const model = {
  // 暫存排組，使用者每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存排組就要清空。
  revealedCards: [],

  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0,

}

// 建立 MVC 架構
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.filpCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.filpCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 成功
          view.renderScore(model.score += 10)

          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(model.revealedCards[0])
          view.pairCards(model.revealedCards[1])
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits

          // 失敗
        } else {
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    // console.log('this.currentState', this.currentState)
    // console.log('revealedCards', model.revealedCards)
  },

  resetCards() {
    view.filpCards(...model.revealedCards)
    model.revealedCards = []
    // 原本包在setTimeout可以用this ，在這邊指向的位置不同要改成controller
    controller.currentState = GAME_STATE.FirstCardAwaits
  },
}

// 呼叫渲染畫面
controller.generateCards()

// 將所有卡片設立點擊監聽器，點擊時則啟動(呼叫) 翻牌函式
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})