import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  const [copyFeedback, setCopyFeedback] = useState('')

  const lowerLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const upperLettersArr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const numbers = '0123456789'.split('')
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/'.split('')

  // Automatyczne włączanie małych liter jeśli wszystko wyłączone
  useEffect(() => {
    if (!abc && !upperLetters && !num && !special) {
      setAbc(true)
    }
  }, [abc, upperLetters, num, special])

  // Ładowanie z localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('passwords') || '[]')
      setPasswordsList(stored)
    } catch (error) {
      console.error('Błąd ładowania danych:', error)
      setPasswordsList([])
    }
  }, [])

  // Zapis do localStorage
  useEffect(() => {
    try {
      localStorage.setItem('passwords', JSON.stringify(passwordsList))
    } catch (error) {
      console.error('Błąd zapisu danych:', error)
    }
  }, [passwordsList])

  // Automatyczne czyszczenie starych haseł (starsze niż 24h)
  useEffect(() => {
    const hour = 1000 * 60 * 60
    const cleanupOldPasswords = () => {
      setPasswordsList(prev => 
        prev.filter(pw => Date.now() - pw.id < 24 * hour)
      )
    }
    
    const interval = setInterval(cleanupOldPasswords, hour)
    return () => clearInterval(interval)
  }, [])

  // Lepsza funkcja sprawdzania siły hasła
  const checkStrength = useCallback((pw) => {
    if (!pw) return 0
    
    let score = 0
    if (pw.length >= 16) score += 2
    else if (pw.length >= 12) score += 2
    else if (pw.length >= 8) score += 1
    
    if (/[a-z]/.test(pw)) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (pw.length >= 20) score++

    if (score >= 6) return 3      // silne
    else if (score >= 4) return 2 // średnie
    else if (score >= 2) return 1 // słabe
    return 0                      // bardzo słabe
  }, [])

  // Szacowanie czasu łamania hasła
  const estimateCrackTime = useCallback((password) => {
    if (!password) return "brak danych"
    
    let charsetSize = 0
    if (abc) charsetSize += 26
    if (upperLetters) charsetSize += 26
    if (num) charsetSize += 10
    if (special) charsetSize += specialChars.length

    const combinations = Math.pow(charsetSize, password.length)
    const attemptsPerSecond = 1e9 // 1 miliard prób na sekundę
    const seconds = combinations / attemptsPerSecond
    
    if (seconds < 60) return "kilka sekund"
    if (seconds < 3600) return "kilka minut"
    if (seconds < 86400) return "kilka godzin"
    if (seconds < 2592000) return "kilka dni"
    if (seconds < 31536000) return "kilka miesięcy"
    if (seconds < 315360000) return "kilka lat"
    return "wiele lat"
  }, [abc, upperLetters, num, special, specialChars.length])

  // Bezpieczne generowanie hasła
  const generatePassword = useCallback(() => {
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

    // Bezpieczne generowanie z crypto.getRandomValues()
    const cryptoArray = new Uint32Array(passwordLength)
    window.crypto.getRandomValues(cryptoArray)
    
    let newPw = ''
    for (let i = 0; i < passwordLength; i++) {
      newPw += chars[cryptoArray[i] % chars.length]
    }

    setPassword(newPw)
    const newStrength = checkStrength(newPw)
    setStrength(newStrength)

    const pwObj = { 
      password: newPw, 
      strength: newStrength, 
      id: Date.now(),
      length: newPw.length,
      crackTime: estimateCrackTime(newPw)
    }

    setPasswordsList(prev => [pwObj, ...prev].slice(0, 100))
  }, [passwordLength, abc, upperLetters, num, special, checkStrength, estimateCrackTime])

  // Kopiowanie do schowka z feedbackiem
  const copyToClipboard = useCallback(async (text) => {
    if (!text) return
    
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback('Skopiowano!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      console.error('Błąd kopiowania:', err)
      setCopyFeedback('Błąd kopiowania!')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [])

  const removePassword = useCallback((id) => {
    setPasswordsList(prev => prev.filter(p => p.id !== id))
  }, [])

  // Etykiety siły hasła
  const strengthLabels = useMemo(() => ({
    0: { text: 'brak', class: 'pw-none' },
    1: { text: 'słabe', class: 'pw-weak' },
    2: { text: 'średnie', class: 'pw-medium' },
    3: { text: 'silne', class: 'pw-strong' }
  }), [])

  // Automatyczne generowanie hasła przy pierwszym renderowaniu
  useEffect(() => {
    generatePassword()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="appRoot">
      <section>
        <div className="card mainSection">
          <h2>Wygenerowane hasło</h2>

          <div className="passwordSection">
            <div className="input">
              <div className="password">
                {password || <span style={{opacity:0.6}}>brak hasła — wybierz opcje i kliknij ⟳</span>}
              </div>

              <div className="items">
                <div className={`passwordStrength ${strengthLabels[strength]?.class || 'pw-none'}`}>
                  {strengthLabels[strength]?.text || 'brak'}
                </div>
                <button className="retry" title="Wygeneruj ponownie" onClick={generatePassword}>⟳</button>
              </div>
            </div>

            <button 
              className="copyBtn primary" 
              onClick={() => password && copyToClipboard(password)}
              disabled={!password}
            >
              Kopiuj
            </button>
          </div>

          <div className="passwordInfo">
            <small style={{color: '#6b7280'}}>
              Czas łamania: ~{estimateCrackTime(password)} | Entropia: {Math.log2(
                [abc, upperLetters, num, special].filter(Boolean).reduce((acc, curr) => {
                  if (curr === abc) return acc + 26
                  if (curr === upperLetters) return acc + 26
                  if (curr === num) return acc + 10
                  if (curr === special) return acc + specialChars.length
                  return acc
                }, 0)
              ).toFixed(1)} bitów
            </small>
          </div>

          <div className="controls">
            <div className="passwordLength">
              <p style={{margin:0}}>Długość hasła: <strong>{passwordLength}</strong></p>
              <button 
                className="lengthBtn" 
                onClick={() => setPasswordLength(p => Math.max(1, p - 1))} 
                disabled={passwordLength <= 1}
              >
                -
              </button>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={passwordLength} 
                onChange={(e) => setPasswordLength(Number(e.target.value))} 
              />
              <button 
                className="lengthBtn" 
                onClick={() => setPasswordLength(p => Math.min(50, p + 1))} 
                disabled={passwordLength >= 50}
              >
                +
              </button>
            </div>

            <div className="inputs">
              <label>
                <input 
                  type="checkbox" 
                  checked={abc} 
                  onChange={() => setAbc(!abc)} 
                /> abc
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={upperLetters} 
                  onChange={() => setUpperLetters(!upperLetters)} 
                /> ABC
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={num} 
                  onChange={() => setNum(!num)} 
                /> 123
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={special} 
                  onChange={() => setSpecial(!special)} 
                /> !@#
              </label>
            </div>
          </div>
        </div>

        <aside className="card sideSection">
          <div className="sideHeader">
            <h1 style={{fontSize:'1.1rem'}}>Ostatnie hasła</h1>
            <div style={{display:'flex', gap:8}}>
              <button 
                className="btnSmall" 
                onClick={() => { setPasswordsList([]) }}
                disabled={passwordsList.length === 0}
              >
                Wyczyść
              </button>
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {passwordsList.length === 0 && (
              <div style={{color:'#6b7280', textAlign: 'center', padding: '20px'}}>
                Brak zapisanych haseł.
              </div>
            )}

            {passwordsList.map((pw) => (
              <div key={pw.id} className="oldPasswords">
                <div className="oldLeft">
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <div className="oldText">{pw.password}</div>
                    <small style={{color:'#6b7280'}}>
                      {pw.length} znaków • Łamanie: ~{pw.crackTime}
                    </small>
                  </div>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div 
                    className={`passwordStrength ${strengthLabels[pw.strength]?.class || 'pw-none'}`} 
                    style={{padding:'6px 8px', fontSize:'0.75rem'}}
                  >
                    {strengthLabels[pw.strength]?.text || 'brak'}
                  </div>

                  <div className="oldActions">
                    <button 
                      className="btnSmall btnCopy" 
                      title="Kopiuj" 
                      onClick={() => copyToClipboard(pw.password)}
                    >
                      Kopiuj
                    </button>
                    <button 
                      className="btnSmall btnDel" 
                      title="Usuń" 
                      onClick={() => removePassword(pw.id)}
                    >
                      Usuń
                    </button>
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