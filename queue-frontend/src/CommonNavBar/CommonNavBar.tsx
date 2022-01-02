import { Container, Nav, Navbar } from 'react-bootstrap'


export type CommonNavBarProps = {
  token: string
  isAdmin: boolean
}

export function CommonNavBar({token, isAdmin}: CommonNavBarProps) {
  return (<Navbar bg="dark" variant="dark">
    <Container className="m-0">
      <Navbar.Brand href={`/#token=${token}`}>
        SS220
      </Navbar.Brand>
      <Nav className="me-auto">
        {
          isAdmin && <Nav.Link href={`/admin#token=${token}`}>Админка</Nav.Link>
        }
      </Nav>
    </Container>
  </Navbar>)
}