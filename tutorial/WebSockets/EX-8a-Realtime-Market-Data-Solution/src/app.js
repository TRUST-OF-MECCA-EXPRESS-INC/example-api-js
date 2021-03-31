import { connect } from './connect'
import { MDS_URL } from './env'
import { setAccessToken } from './storage'
import { MarketDataSocket } from './MarketDataSocket'
import { renderQuote } from './renderQuote'

const main = async () => {

    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    }, data => {
        if(typeof data === 'string') return
        const { accessToken, userId, userStatus, name, expirationTime } = data
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    })

    //HTML elements
    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $unsubBtn     = document.getElementById('unsubscribe-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $discBtn      = document.getElementById('disconnect-btn')
    const $statusInd    = document.getElementById('status')

    //The websocket helper tool
    const socket = new MarketDataSocket()

    //give user some feedback about the state of their connection
    //by adding an event listener to 'message' that will change the color
    const onStateChange = msg => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }
    //add your feedback function to the socket's
    socket.getSocket().addEventListener('message', onStateChange)

    $connBtn.addEventListener('click', () => {
        if(socket.isConnected()) return

        socket.connect(MDS_URL)    
        socket.getSocket().addEventListener('message', onStateChange)
    })

    //disconnect socket on disconnect button click
    $discBtn.addEventListener('click', () => {
        if(!socket.isConnected()) return

        socket.disconnect()
        $statusInd.style.backgroundColor = 'red'
        $outlet.innerText = ''
        
    })

    $unsubBtn.addEventListener('click', () => {
        socket.unsubscribeQuote('BTCH1')
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', async () => {

        socket.subscribeQuote('BTCH1', data => {
            const newElement = document.createElement('div')
            newElement.innerHTML = renderQuote(data)
            $outlet.firstElementChild
                ? $outlet.firstElementChild.replaceWith(newElement)
                : $outlet.append(newElement)
        })
        
    })
}

main()