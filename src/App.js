import React from "react";

export default function App() {

  const ranks = [
    "A","K","Q","J","T",
    "9","8","7","6","5",
    "4","3","2"
  ];

  // =========================
  // PLAYER NAME
  // =========================
  const [playerName, setPlayerName] = React.useState("Anónimo");

  // =========================
  // WEB3FORMS
  // =========================
  const WEB3FORMS_KEY = "48cd5f82-c87c-46bd-a32b-8348ea2f2707";

  // =========================
  // SPOTS
  // =========================
  const spotGroups = {

    "Call de BB a Open push de CO": [
      "Call de BB con 15bbs vs push de CO de 5bb",
      "Call de BB con 15bbs vs push de CO de 6bb"
    ],

    "Open push de CO": [
      "Push de CO 6bbs (BU 20bbs, SB 20bbs, BB 15bbs)",
      "Push de CO 6bbs (BU 20bbs, SB 20bbs, BB 15bbs)"
    ],

    "Push de SB vs BB": Array.from(
      { length: 18 },
      (_, i) => `SB Push ${i + 3}bb vs BB`
    )
  };

  const allSpots =
    Object.values(spotGroups).flat();

  // =========================
  // STATE
  // =========================
  const [selectedSpot, setSelectedSpot] =
    React.useState(allSpots[0]);

  const [spotRanges, setSpotRanges] =
    React.useState({});

  const [confirmedSpots, setConfirmedSpots] =
    React.useState({});

  const [sentGroups, setSentGroups] =
    React.useState({});

  const [selectedHands, setSelectedHands] =
    React.useState([]);

  const [sliderValue, setSliderValue] =
    React.useState(0);

  const [mode, setMode] =
    React.useState("slider");

  const isMouseDown = React.useRef(false);
  const dragMode = React.useRef(null);

  // =========================
  // EQUITY ORDER
  // =========================
  const order = {
    A:13,K:12,Q:11,J:10,T:9,
    9:8,8:7,7:6,6:5,5:4,
    4:3,3:2,2:1
  };

  const getStrength = (r1, r2) => {
    let base = order[r1] + order[r2];
    if (r1 === r2) base += 30;
    return base;
  };

  // =========================
  // ALL HANDS
  // =========================
  const allHands = React.useMemo(() => {

    const list = [];

    for (let i = 0; i < ranks.length; i++) {
      for (let j = i; j < ranks.length; j++) {

        const r1 = ranks[i];
        const r2 = ranks[j];

        if (i === j) {

          list.push({
            hand: r1 + r2,
            weight: 6,
            strength: getStrength(r1, r2)
          });

        } else {

          list.push({
            hand: r1 + r2 + "s",
            weight: 4,
            strength: getStrength(r1, r2)
          });

          list.push({
            hand: r1 + r2 + "o",
            weight: 12,
            strength: getStrength(r1, r2)
          });
        }
      }
    }

    list.sort((a,b)=>b.strength-a.strength);
    return list;

  }, []);

  const totalCombos = React.useMemo(
    () => allHands.reduce((s,h)=>s+h.weight,0),
    [allHands]
  );

  // =========================
  // SLIDER -> RANGE
  // =========================
  const buildRangeFromSlider = (val) => {

    if (val <= 0) return [];

    let acc = 0;
    const target = (val/100)*totalCombos;
    const res = [];

    for (const h of allHands) {
      if (acc >= target) break;
      res.push(h.hand);
      acc += h.weight;
    }

    return res;
  };

  // =========================
  // RANGE -> SLIDER
  // =========================
  const calcSliderFromHands = (hands) => {

    if (!hands.length) return 0;

    let sum = 0;

    for (const h of allHands) {
      if (hands.includes(h.hand)) {
        sum += h.weight;
      }
    }

    return Math.round((sum/totalCombos)*100);
  };

  // =========================
  // LOAD SPOT
  // =========================
  React.useEffect(() => {

    const saved =
      spotRanges[selectedSpot] || [];

    setSelectedHands(saved);

    setSliderValue(
      calcSliderFromHands(saved)
    );

  }, [selectedSpot]);

  // =========================
  // SYNC SLIDER
  // =========================
  React.useEffect(() => {

    if (mode === "slider") {

      const range =
        buildRangeFromSlider(sliderValue);

      setSelectedHands(range);

      setSpotRanges(prev => ({
        ...prev,
        [selectedSpot]: range
      }));
    }

  }, [sliderValue, mode]);

  // =========================
  // SYNC GRID
  // =========================
  React.useEffect(() => {

    if (mode === "grid") {

      setSliderValue(
        calcSliderFromHands(selectedHands)
      );

      setSpotRanges(prev => ({
        ...prev,
        [selectedSpot]: selectedHands
      }));
    }

  }, [selectedHands, mode]);

  // =========================
  // DRAG LOGIC
  // =========================
  const toggle = (h) => {

    setMode("grid");

    setSelectedHands(prev => {

      const exists = prev.includes(h);

      dragMode.current = exists ? "remove" : "add";

      return exists
        ? prev.filter(x=>x!==h)
        : [...prev,h];
    });
  };

  const paint = (h) => {

    setMode("grid");

    setSelectedHands(prev => {

      const exists = prev.includes(h);

      if (dragMode.current === "add") {
        if (exists) return prev;
        return [...prev,h];
      }

      if (dragMode.current === "remove") {
        if (!exists) return prev;
        return prev.filter(x=>x!==h);
      }

      return prev;
    });
  };

  // =========================
  // CONFIRM
  // =========================
  const isConfirmed =
    confirmedSpots[selectedSpot] &&
    JSON.stringify(confirmedSpots[selectedSpot]) === JSON.stringify(selectedHands);

  const confirmSpot = () => {
    if (!selectedHands.length) return;

    setConfirmedSpots(prev => ({
      ...prev,
      [selectedSpot]: [...selectedHands]
    }));
  };

  // =========================
  // GROUP CHECK
  // =========================
  const isGroupComplete = (g) =>
    spotGroups[g].every(s => confirmedSpots[s]);

  // =========================
  // SEND GROUP (WEB3FORMS)
  // =========================
  const sendGroup = async (g) => {

    const spots = spotGroups[g];

    const allConfirmed = spots.every(
      spot => !!confirmedSpots[spot]
    );

    if (!allConfirmed) {
      alert("No puedes enviar el grupo: hay spots sin confirmar.");
      return;
    }

    const groupData = spots.map(spot => ({
      spot,
      confirmedRange: confirmedSpots[spot],
      isConfirmed: true
    }));

    const payload = {
      access_key: WEB3FORMS_KEY,

      subject: `Poker Group Submission: ${g} - ${playerName}`,

      message: `
PLAYER: ${playerName}

GROUP: ${g}

ALL SPOTS CONFIRMED ✔

DATA:
${JSON.stringify(groupData, null, 2)}
      `
    };

    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    setSentGroups(prev => ({ ...prev, [g]: true }));
  };

  // =========================
  // UI
  // =========================
  return (
    <div
      style={{
        padding:20,
        background:"#0a0a0a",
        color:"white",
        minHeight:"100vh"
      }}
      onMouseUp={()=>{
        isMouseDown.current=false;
        dragMode.current=null;
      }}
    >

      {/* TITLE */}
      <h1 style={{textAlign:"center",fontSize:42}}>
        63 left cobran 27 avg 15bbs
      </h1>

      {/* NAME INPUT */}
      <div style={{textAlign:"center", marginBottom:15}}>
        <input
          type="text"
          placeholder="Tu nombre (o Anónimo)"
          value={playerName === "Anónimo" ? "" : playerName}
          onChange={(e)=>
            setPlayerName(e.target.value || "Anónimo")
          }
          style={{
            padding:10,
            borderRadius:8,
            border:"1px solid #333",
            background:"#000",
            color:"#fff",
            width:220,
            textAlign:"center"
          }}
        />
      </div>

      <p style={{textAlign:"center",color:"#aaa",marginBottom:20}}>
        Esto no es un examen, responde lo que crees que hace el meta o lo que harías tú, sin mirar el solver. Para enviar la respuesta tienes que confirmar todos los spots de un grupo
      </p>

      {/* GROUP BUTTONS */}
      <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {Object.keys(spotGroups).map(g=>{

          const complete = isGroupComplete(g);
          const sent = !!sentGroups[g];

          return (
            <button
              key={g}
              disabled={!complete || sent}
              onClick={()=>sendGroup(g)}
              style={{
                padding:"10px 14px",
                background: sent ? "#2563eb" : complete ? "#22c55e" : "#222",
                color: sent ? "white" : complete ? "black" : "#666",
                border:"none",
                borderRadius:8,
                fontWeight:"bold"
              }}
            >
              {sent ? `Enviado ✔ ${g}` : `Enviar ${g}`}
            </button>
          );
        })}
      </div>

      {/* SELECTOR */}
      <div style={{textAlign:"center",marginBottom:20}}>
        <select
          value={selectedSpot}
          onChange={(e)=>setSelectedSpot(e.target.value)}
          style={{
            padding:10,
            background: confirmedSpots[selectedSpot] ? "#15803d" : "#000",
            color:"#fff",
            border:"1px solid #333",
            borderRadius:8,
            minWidth:340,
            fontWeight:"bold"
          }}
        >
          {Object.entries(spotGroups).map(([g,spots])=>(
            <optgroup key={g} label={g}>
              {spots.map(s=>{
                const c = !!confirmedSpots[s];
                return (
                  <option
                    key={s}
                    value={s}
                    style={{
                      background: c ? "#15803d" : "#000",
                      color:"#fff"
                    }}
                  >
                    {c ? "✔ " : ""}{s}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </div>

      {/* GRID */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(13,1fr)",
        gap:2,
        maxWidth:850,
        margin:"0 auto"
      }}>
        {ranks.map((_,i)=>
          ranks.map((_,j)=>{

            let hand;
            if(i===j) hand=ranks[i]+ranks[j];
            else if(i<j) hand=ranks[i]+ranks[j]+"s";
            else hand=ranks[j]+ranks[i]+"o";

            const active = selectedHands.includes(hand);

            return (
              <button
                key={hand}
                onMouseDown={()=>{
                  isMouseDown.current=true;
                  toggle(hand);
                }}
                onMouseEnter={()=>{
                  if(isMouseDown.current) paint(hand);
                }}
                style={{
                  aspectRatio:"1/1",
                  background: active ? "#22c55e" : "#222",
                  color: active ? "black" : "white",
                  border:"1px solid #333",
                  fontSize:10
                }}
              >
                {hand}
              </button>
            );
          })
        )}
      </div>

      {/* SLIDER */}
      <div style={{textAlign:"center",marginTop:30}}>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e)=>{
            setMode("slider");
            setSliderValue(+e.target.value);
          }}
          style={{width:300}}
        />
      </div>

      {/* CONFIRM */}
      <div style={{textAlign:"center",marginTop:20}}>
        <button
          onClick={confirmSpot}
          disabled={!selectedHands.length}
          style={{
            padding:"10px 16px",
            background: isConfirmed ? "#22c55e" : !selectedHands.length ? "#222" : "#333",
            color: isConfirmed ? "black" : !selectedHands.length ? "#666" : "white",
            border:"none",
            fontWeight:"bold",
            borderRadius:8
          }}
        >
          {isConfirmed ? "Confirmado ✔" : "Confirmar spot"}
        </button>
      </div>

    </div>
  );
}