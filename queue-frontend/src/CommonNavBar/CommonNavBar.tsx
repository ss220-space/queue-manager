import { Nav, Navbar } from 'react-bootstrap'


export type CommonNavBarProps = {
  token: string
  isAdmin: boolean
}

export function CommonNavBar({token, isAdmin}: CommonNavBarProps) {
  return (<Navbar>
    <Navbar.Brand href={`/#token=${token}`}>
      SS220
    </Navbar.Brand>
    {
      isAdmin && <Nav.Link href={`/admin#token=${token}`}>Админка</Nav.Link>
    }
  </Navbar>)
}