import { Fragment } from 'react'
import { Button, Modal } from 'react-bootstrap'
import useSWR from 'swr'
import { getBackendData } from '../utils'
import moment from "moment"

const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || ''

export type BanModalProps = {
  token: string
  profile?: { hasActiveBan: boolean }
}

type BanInfo = {
  ckey: string
  a_ckey: string
  bantype: string
  expiration_time: Date
  bantime: Date
  reason: string
}

const declOfNum = (n: number, titles: string[]) => {
  n = Math.abs(n);
  return titles[
    n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
    ];
};



function formatBanRemaining(expiration: Date) {
  function pad(n: number) {
    if (n < 10) return `0${n}`
    return `${n}`
  }
  const exp = moment(expiration)
  const now = moment()
  const diff = moment.duration(exp.diff(now))
  const days = diff.days()
  return `${days} ${declOfNum(days, ['день', 'дня', 'дней'])} ${pad(diff.hours())}:${pad(diff.minutes())}:${pad(diff.seconds())}`
}

function banMessage(ban: BanInfo) {

  const isPermBan = ban.bantype == "PERMABAN" || ban.bantype == "ADMIN_PERMABAN"

  return (
      <Fragment>
        <p>
          <b>Сикей:&nbsp;</b>
          {ban.ckey}
        </p>
        <p>
          <b>Админ:&nbsp;</b>
          {ban.a_ckey}
        </p>
        <p>
          <b>Выдан:&nbsp;</b>
          {
            isPermBan ? ban.bantime : `${ban.bantime} по ${ban.expiration_time}`
          }
        </p>
        {
          !isPermBan && (
            <p>
              <b>Осталось:&nbsp;</b>
              { formatBanRemaining(ban.expiration_time) }
            </p>
          )
        }
        <p>
          <b>Причина:&nbsp;</b>
          { ban.reason }
        </p>
      </Fragment>
  )

}

export function BanModal({token, profile}: BanModalProps) {
  const { data: ban } = useSWR<BanInfo>(profile && profile.hasActiveBan ? `/api/v1/users/ban` : null, async (url) => await (await getBackendData(url, token)).json())


  return (
    <Modal show={ban != null}>
      <Modal.Header>
        <Modal.Title>Бан</Modal.Title>
      </Modal.Header>
      {ban &&
          <Modal.Body>
            {banMessage(ban)}
          </Modal.Body>
      }
      <Modal.Footer>
        <Button variant="primary" target="_blank" href={discordUrl}>
          Discord
        </Button>
      </Modal.Footer>
    </Modal>
  )
}