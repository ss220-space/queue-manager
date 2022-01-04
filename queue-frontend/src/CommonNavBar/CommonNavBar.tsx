/* eslint-disable @next/next/no-img-element */
import { Container, Nav, Navbar } from 'react-bootstrap'

export type CommonNavBarProps = {
  token: string
  isAdmin: boolean
}

export function CommonNavBar({token, isAdmin}: CommonNavBarProps) {
  return (<Navbar className="common-nav" variant="dark">
    <Container className="mx-0">
      <Container>
        <Navbar.Brand href={`/#token=${token}`} className="fw-bold fw">
          <img
            src="/ss220.logo.32.png"
            alt="SS220 Logo"
            width={30}
            height={30}
            className="d-inline-block align-top"
          />{' '}
          SS220
        </Navbar.Brand>
      </Container>
      <Nav className="me-auto">
        {
          isAdmin && <Nav.Link href={`/admin#token=${token}`}>Админка</Nav.Link>
        }
      </Nav>
    </Container>
  </Navbar>)
}