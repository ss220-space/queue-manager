/* eslint-disable @next/next/no-img-element */
import { Container, Nav, Navbar } from 'react-bootstrap'
import Link from 'next/link'

export type CommonNavBarProps = {
  token: string
  isAdmin: boolean
}

export function CommonNavBar({token, isAdmin}: CommonNavBarProps) {
  return (<Navbar className="common-nav" variant="dark">
    <Container className="mx-0">
      <Link href={`/#token=${token}`} passHref scroll={false}>
        <Navbar.Brand className="fw-bold fw">
          <img
            src="/ss220.logo.32.png"
            alt="SS220 Logo"
            width={30}
            height={30}
            className="d-inline-block align-top"
          />{' '}
          SS220
        </Navbar.Brand>
      </Link>
      <Nav className="me-auto">
        {
          isAdmin && 
          <Link href={`/admin#token=${token}`} passHref scroll={false}>
            <Nav.Link>Админка</Nav.Link>
          </Link>
        }
      </Nav>
    </Container>
  </Navbar>)
}