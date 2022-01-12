/* eslint-disable @next/next/no-img-element */
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import Link from "next/link";

export type CommonNavBarProps = {
  token: string;
  isAdmin: boolean;
};

export function CommonNavBar({ token, isAdmin }: CommonNavBarProps) {
  return (
    <Navbar className="common-nav" variant="dark">
      <Container className="mx-0">
        <Link href={`/#token=${token}`} passHref scroll={false}>
          <Navbar.Brand className="fw-bold fw">
            <img
              src="/ss220.logo.32.png"
              alt="SS220 Logo"
              width={30}
              height={30}
              className="d-inline-block align-top"
            />{" "}
            SS220
          </Navbar.Brand>
        </Link>
        <Nav className="me-auto">
          <Nav.Link href="http://discord.ss220.space/" target={"_blank"}>
            Discord
          </Nav.Link>
          <NavDropdown title="Вики" id="navbarScrollingDropdown">
            <NavDropdown.Item
              href="https://wiki.ss220.space/"
              target={"_blank"}
            >
              Paradise
            </NavDropdown.Item>
            <NavDropdown.Item
              href="https://sierra.ss220.space/"
              target={"_blank"}
            >
              Infinity
            </NavDropdown.Item>
            <NavDropdown.Item href="https://tg.ss220.space/" target={"_blank"}>
              TGMC
            </NavDropdown.Item>
          </NavDropdown>
          <NavDropdown title="Правила" id="navbarScrollingDropdown">
            <NavDropdown.Item
              href="https://wiki.ss220.space/index.php/%D0%9F%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0_%D0%A1%D0%B5%D1%80%D0%B2%D0%B5%D1%80%D0%B0"
              target={"_blank"}
            >
              Paradise
            </NavDropdown.Item>
            <NavDropdown.Item
              href="https://sierra.ss220.space/index.php/%D0%9F%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0_%D1%81%D0%B5%D1%80%D0%B2%D0%B5%D1%80%D0%B0"
              target={"_blank"}
            >
              Infinity
            </NavDropdown.Item>
            <NavDropdown.Item
              href="https://tg.ss220.space/index.php/TGMC:Rules"
              target={"_blank"}
            >
              TGMC
            </NavDropdown.Item>
          </NavDropdown>
          {isAdmin && (
            <Link href={`/admin#token=${token}`} passHref scroll={false}>
              <Nav.Link>Админка</Nav.Link>
            </Link>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}
