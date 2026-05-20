import { useEffect, useState, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'


const BASE_AMOUNT_CENTS = 10000;

const fetchQuote = async (splitPercent) => {
const requestDelay = Math.random() * 1500 + 300
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
      quoteId:crypto.randomUUID(),
      splitPercent,
      amountCents: Math.round((BASE_AMOUNT_CENTS * splitPercent) / 100)
    })
    },requestDelay)
  })
}

const createPayment = async (quoteId, amountCents, idempotencyKey) => {
  return new Promise((resolve,reject) => {
    if (!quoteId || amountCents <= 0 || !idempotencyKey) {
    return reject('Invalid paymnet')
  }
    setTimeout(()=>{
      resolve({
        success:true,
        paymentId: `pay-${quoteId}-${idempotencyKey}`,
      })
    },1000)
  })
}


function App() {
  const [splitPercent, setSplitPercent] = useState(10)
  const [status, setStatus] = useState('idle')
  const [quote,setQuote] = useState(null)
  const [lastPayment, setLastPayment] = useState(null)
  const idempotencyKeyRef = useRef(null)
  const quoteSeqRef = useRef(1);
  const payingRef = useRef(false);


  useEffect(() => {
    const seq = ++quoteSeqRef.current;
    setStatus('loading quote');
    fetchQuote(splitPercent).then(qu =>{
      if (seq !== quoteSeqRef.current) return;
      setQuote(qu)
      idempotencyKeyRef.current = null
      setStatus('ready')
    }).catch(() => {
      setQuote(null)
      setStatus('error')
    })
  },[splitPercent])


  const handlePay = async () => {
    if (!quote || payingRef.current) return;
    
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    payingRef.current = true;
    setStatus('paying');
    try {
      const result = await createPayment(quote.quoteId,quote.amountCents, idempotencyKeyRef.current)
      setLastPayment(result);
      setStatus('paid');
    } catch (error) {
      setStatus('error');
      throw new Error(error)
    } finally {
      payingRef.current = false
    }
  }

  const payDisabled =
    !quote || status === 'loading quote' || status === 'paying';


  return (
    <div style={{
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      marginTop:200
    }}>
      <div style={{
        display:'flex',
        alignItems:'center'
      }}>
        <p>Split%</p>
        <input style={{
          minWidth:200
        }} type='number' min={1} max={100} value={splitPercent} onChange={e => setSplitPercent(e.target.value)} placeholder='Type split' />
      </div>
      <div>
        Quote: {quote
          ? `${quote.quoteId} — ${quote.amountCents} cents (${quote.splitPercent}%)`
          : status === 'loading quote'
            ? 'loading…'
            : '—'}
      </div>
      <div> Status: {status}</div>
      <div>
        {lastPayment && <p>Payment: {lastPayment.paymentId}</p>}
      </div>

      <button type="button" onClick={handlePay} disabled={payDisabled}>
        Pay
      </button>
    </div>
  )
}

export default App
