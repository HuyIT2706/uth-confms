import React from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { prefetchRouteByPath } from '../routes.config.tsx'

export default function PrefetchLink(props: LinkProps) {
  const { to, onMouseEnter, onFocus, ...rest } = props

  const handlePrefetch = () => {
    try {
      let path: string | undefined
      if (typeof to === 'string') path = to
      else if (typeof to === 'object' && to !== null && 'pathname' in to) path = (to as { pathname?: string }).pathname
      if (path) prefetchRouteByPath(path).catch(() => {})
    } catch {
      // ignore
    }
  }

  return (
    <Link
      {...rest}
      to={to}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        handlePrefetch()
        const cb = onMouseEnter as React.MouseEventHandler<HTMLAnchorElement> | undefined
        cb?.(e)
      }}
      onFocus={(e: React.FocusEvent<HTMLAnchorElement>) => {
        handlePrefetch()
        const cb = onFocus as React.FocusEventHandler<HTMLAnchorElement> | undefined
        cb?.(e)
      }}
    />
  )
}
