import React, { useState, useEffect } from 'react'
import './App.css'

export default function App() {

  const [passwordLength, setPasswordLength] = useState(12)
  const [password, setPassword] = useState('')
  const [abc, setAbc] = useState(true)
  const [upperLetters, setUpperLetters] = useState(true)
  const [num, setNum] = useState(true)
  const [special, setSpecial] = useState(false)
  const [strength, setStrength] = useState(0)
  const [passwordsList, setPasswordsList] = useState([])

  
  const lowerLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const upperLettersArr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const numbers = '0123456789'.split('')
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/'.split('')

 
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('passwords') || '[]')
    setPasswordsList(stored)
  }, [])

 
  useEffect(() => {
    localStorage.setItem('passwords', JSON.stringify(passwordsList))
  }, [passwordsList])

  function checkStrength(pw) {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) setStrength(1)
    else if (score === 2) setStrength(2)
    else if (score >= 3) setStrength(3)
  }

  function generatePassword() {
    let chars = []
    if (abc) chars = chars.concat(lowerLetters)
    if (upperLetters) chars = chars.concat(upperLettersArr)
    if (num) chars = chars.concat(numbers)
    if (special) chars = chars.concat(specialChars)

    if (chars.length === 0) {
      setPassword('')
      setStrength(0)
      return
    }

    let newPw = ''
    for (let i = 0; i < passwordLength; i++) {
      newPw += chars[Math.floor(Math.random() * chars.length)]
    }

    setPassword(newPw)
    checkStrength(newPw)

    const pwObj = { password: newPw, strength: (() => {
      let s = 0
      if (newPw.length >= 8) s++
      if (/[A-Z]/.test(newPw)) s++
      if (/[0-9]/.test(newPw)) s++
      if (/[^A-Za-z0-9]/.test(newPw)) s++
      if (s <= 1) return 1
      if (s === 2) return 2
      return 3
    })(), id: Date.now() }

    setPasswordsList(prev => [pwObj, ...prev].slice(0, 100)) 
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
  }

  function removePassword(id) {
    const filtered = passwordsList.filter(p => p.id !== id)
    setPasswordsList(filtered)
  }

  return (
    <div className="appRoot">
      

      <section>
        <div className="card mainSection">
          <h2>Wygenerowane hasło</h2>

          <div className="passwordSection">
            <div className="input">
              <div className="password">{password || <span style={{opacity:0.6}}>brak hasła — wybierz opcje i kliknij ⟳</span>}</div>

              <div className="items">
                <div className={`passwordStrength ${strength === 0 ? 'pw-none' : strength === 1 ? 'pw-weak' : strength === 2 ? 'pw-medium' : 'pw-strong'}`}>
                  {strength === 0 ? 'brak' : strength === 1 ? 'słabe' : strength === 2 ? 'średnie' : 'silne'}
                </div>
                <button className="retry" title="Wygeneruj ponownie" onClick={generatePassword}>⟳</button>
              </div>
            </div>

            <button className="copyBtn primary" onClick={() => password && copyToClipboard(password)}>KOPIUJ</button>
          </div>

          <div className="controls">
            <div className="passwordLenght">
              <p style={{margin:0}}>Długość hasła: <strong>{passwordLength}</strong></p>
              <button className="lengthBtn" onClick={() => setPasswordLength(p => Math.max(1, p - 1))} disabled={passwordLength <= 1}>-</button>
              <input type="range" min="1" max="50" value={passwordLength} onChange={(e) => setPasswordLength(Number(e.target.value))} />
              <button className="lengthBtn" onClick={() => setPasswordLength(p => Math.min(50, p + 1))} disabled={passwordLength >= 50}>+</button>
            </div>

            <div className="inputs">
              <label><input type="checkbox" checked={abc} onChange={() => setAbc(!abc)} /> abc</label>
              <label><input type="checkbox" checked={upperLetters} onChange={() => setUpperLetters(!upperLetters)} /> ABC</label>
              <label><input type="checkbox" checked={num} onChange={() => setNum(!num)} /> 123</label>
              <label><input type="checkbox" checked={special} onChange={() => setSpecial(!special)} /> !@#</label>
            </div>

          </div>

        </div>

        <aside className="card sideSection">
          <div className="sideHeader">
            <h1 style={{fontSize:'1.1rem'}}>Ostatnie hasła</h1>
            <div style={{display:'flex', gap:8}}>
              <button className="btnSmall" onClick={() => { setPasswordsList([]) }}>Wyczyść</button>
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {passwordsList.length === 0 && <div style={{color:'#6b7280'}}>Brak zapisanych haseł.</div>}

            {passwordsList.map((pw) => (
              <div key={pw.id} className="oldPasswords">
                <div className="oldLeft">
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <div className="oldText">{pw.password}</div>
                    <small style={{color:'#6b7280'}}>{pw.password.length} znaków</small>
                  </div>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div className={`passwordStrength ${pw.strength === 1 ? 'pw-weak' : pw.strength === 2 ? 'pw-medium' : 'pw-strong'}`} style={{padding:'6px 8px', fontSize:'0.75rem'}}>
                    {pw.strength === 1 ? 'słabe' : pw.strength === 2 ? 'średnie' : 'silne'}
                  </div>

                  <div className="oldActions">
                    <button className="btnSmall btnCopy" title="Kopiuj" onClick={() => copyToClipboard(pw.password)}>Kopiuj</button>
                    <button className="btnSmall btnDel" title="Usuń" onClick={() => removePassword(pw.id)}>Usuń</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </aside>
      </section>
    </div>
  )
}
