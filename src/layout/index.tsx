import React from 'react'
import HeaderComponents from './components/header'
import FooterComponents from './components/footer'

function PageLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-h-screen flex w-full flex-col">
      <HeaderComponents />
      <main className="flex-1 pt-16">{children}</main>
      <FooterComponents />
    </div>
  )
}

export default PageLayout
