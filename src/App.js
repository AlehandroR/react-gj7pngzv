import React from "react";

export default function App() {

  const ranks = [
    "A","K","Q","J","T",
    "9","8","7","6","5",
    "4","3","2"
  ];

  const [playerName, setPlayerName] = React.useState("Anónimo");

  const WEB3FORMS_KEY = "48cd5f82-c87c-46bd-a32b-8348ea2f2707";

  const spotGroups = {

    "Call de BB a Open push de CO": [
      "BB Call con 15bn a open push de CO 5bb",
      "BB Call con 15bb a open push de CO 6bb"
    ],

    "Open push de CO": [
      "CO Push 5bb (BU20bb SB20bb BB15bb)",
      "CO Push 6bb (BU20bb SB20bb BB15bb)"
    ],

    "Push de SB vs BB": Array.from(
      { length: 18 },
      (_, i) => `SB Push ${i + 3}bb vs BB`
    )
  };

  const allSpots = Object.values(spotGroups).flat();

  const [selectedSpot, setSelectedSpot] = React.useState(allSpots[0]);
  const [spotRanges, setSpotRanges] = React.useState({});
  const [confirmedSpots, setConfirmedSpots] = React.useState({});
  const [sentGroups, setSentGroups] = React.useState({});
  const [selectedHands, setSelectedHands] = React.useState([]);
  const [sliderValue, setSliderValue] = React.useState(0);
  const [mode, setMode] = React.useState("slider");

  const isMouseDown = React.useRef(false);
  const dragMode = React.useRef(null);

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

  React.useEffect(() => {

    const saved = spotRanges[selectedSpot] || [];

    setSelectedHands(saved);
    setSliderValue(calcSliderFromHands(saved));

  }, [selectedSpot]);

  React.useEffect(() => {

    if (mode === "slider") {

      const range = buildRangeFromSlider(sliderValue);

      setSelectedHands(range);

      setSpotRanges(prev => ({
        ...prev,
        [selectedSpot]: range
      }));
    }

  }, [sliderValue, mode]);

  React.useEffect(() => {

    if (mode === "grid") {

      setSliderValue(calcSliderFromHands(selectedHands));

      setSpotRanges(prev => ({
        ...prev,
        [selectedSpot]: selectedHands
      }));
    }

  }, [selectedHands, mode]);

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

  const isGroupComplete = (g) =>
    spotGroups[g].every(s => confirmedSpots[s]);

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

    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Poker Group Submission: ${g} - ${playerName}`,
        message: `
PLAYER: ${playerName}

GROUP: ${g}

DATA:
${JSON.stringify(groupData, null, 2)}
        `
      })
    });

    setSentGroups(prev => ({ ...prev, [g]: true }));
  };

  return (
    <div style={{padding:20, background:"#0a0a0a", color:"white", minHeight:"100vh"}}>

      {/* TITLE */}
      <h1 style={{textAlign:"center",fontSize:42}}>
        63 left cobran 27 avg 15bbs
      </h1>

      <p style={{textAlign:"center",color:"#aaa"}}>
        Esto no es un examen, responde lo que crees que hace el meta o lo que harías tú, sin mirar el solver
      </p>

      {/* NAME */}
      <div style={{textAlign:"center",marginBottom:15}}>
        <input
          value={playerName}
          onChange={(e)=>setPlayerName(e.target.value)}
          placeholder="Tu nombre o Anónimo"
          style={{padding:10,borderRadius:8}}
        />
      </div>

      {/* GROUPS */}
      <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
        {Object.keys(spotGroups).map(g => {
          const complete = isGroupComplete(g);

          return (
            <button
              key={g}
              onClick={()=>sendGroup(g)}
              disabled={!complete}
              style={{
                padding:10,
                borderRadius:8,
                background: complete ? "#22c55e" : "#333",
                color:"white",
                border:"none"
              }}
            >
              Enviar {g}
            </button>
          );
        })}
      </div>

      {/* SELECTOR */}
      <div style={{textAlign:"center",margin:20}}>
        <select
          value={selectedSpot}
          onChange={(e)=>setSelectedSpot(e.target.value)}
          style={{padding:10,borderRadius:8}}
        >
          {Object.entries(spotGroups).map(([g,spots])=>(
            <optgroup key={g} label={g}>
              {spots.map(s=>(
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* GRID (simplificado visual pero funcional) */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(13,1fr)",gap:2,maxWidth:800,margin:"0 auto"}}>
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
                onMouseDown={()=>toggle(hand)}
                onMouseEnter={()=>paint(hand)}
                style={{
                  aspectRatio:"1/1",
                  fontSize:10,
                  background: active ? "#22c55e" : "#222",
                  color:"white",
                  border:"1px solid #333"
                }}
              >
                {hand}
              </button>
            );
          })
        )}
      </div>

      {/* SLIDER */}
      <div style={{textAlign:"center",marginTop:20}}>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e)=>setSliderValue(+e.target.value)}
        />
      </div>

      {/* CONFIRM */}
      <div style={{textAlign:"center",marginTop:20}}>
        <button
          onClick={confirmSpot}
          style={{
            padding:10,
            borderRadius:8,
            background:"#333",
            color:"white"
          }}
        >
          Confirmar spot
        </button>
      </div>

    </div>
  );
}