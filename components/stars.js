export default function Stars({children, setAnimate, animate}) {

    return (
        <>
        <div className={!animate ? 'stars set1' : 'stars move1'}></div>
        <div className={!animate ? 'stars2 set2' : 'stars2 move2'}></div>
        <div className={!animate ? 'stars3 set3' : 'stars3 move3'}></div>
        <div className={'tailstars'}></div>
        </>
    )
}