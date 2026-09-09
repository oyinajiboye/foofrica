import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/design-system.css'
const Icon=({type})=><svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' aria-hidden='true'>{type==='search'?<><circle cx='10' cy='10' r='6'/><path d='m15 15 6 6'/></>:<><path d='M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'/></>}</svg>
export default function AppHeader(){
 const navigate=useNavigate();const {user}=useAuth()
 return <header className="design-header"><Link to="/feed" aria-label="Footfrica home"><img src="/logo-landscape-color.png" alt="Footfrica"/></Link><form role="search" onSubmit={e=>{e.preventDefault();navigate('/search?q='+encodeURIComponent(new FormData(e.currentTarget).get('q')))}}><Icon type='search'/><input name="q" aria-label="Search football" placeholder="Search players, clubs, topics…"/></form><nav aria-label="Main navigation"><NavLink to="/feed">Home</NavLink><NavLink to="/highlights">Highlights</NavLink><NavLink to="/messages">Messages</NavLink><NavLink to="/notifications" aria-label="Notifications"><Icon type="bell"/></NavLink><Link className="design-avatar" to="/profile" aria-label="My profile">{user?.display_name?.slice(0,1)||'○'}</Link></nav></header>
}
