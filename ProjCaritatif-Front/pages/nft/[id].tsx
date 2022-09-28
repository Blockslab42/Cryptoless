import { NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import testImage from '../../public/test.jpg'
import styles from './nft.module.scss'
import { ethers } from 'ethers'
import abi from '../../public/abi.json'
import { useEffect, useState } from 'react'
import { getImageSize } from 'next/dist/server/image-optimizer'

const Nft: NextPage = () => {
  const [data, setData] = useState<any>()
  const [contract, setContract] = useState<any>()
  const [tokenUri, setTokenUri] = useState<any>()
  const [nftExist, setNftExist] = useState<boolean>()
  const [loading, setLoading] = useState<boolean>()
  const router = useRouter()

  useEffect(() => {
    const address = '0xe8B53d1A2699c375cDbF11AE48af240f76F6582c'
    const provider = ethers.getDefaultProvider('rinkeby')
    setContract(new ethers.Contract(address, abi, provider))
  }, [])

  useEffect(() => {
    if (!contract || !router.query?.id) return
    ;(async () => {
      setLoading(true)
      if (
        parseInt(await contract.totalSupply()) > parseInt(router.query?.id!)
      ) {
        setNftExist(true)
        contract.tokenURI(router.query?.id).then((e: any) => {
          setTokenUri(e.replace('ipfs://', 'https://ipfs.io/ipfs/'))
        })
      } else {
        setNftExist(false)
        setLoading(false)
      }
    })()
  }, [contract, router])

  useEffect(() => {
    if (!tokenUri) return
    ;(async () => {
      const datas = await fetch(tokenUri)
      setLoading(false)
      setData(await datas.json())
    })()
  }, [tokenUri])

  useEffect(() => {
    if (!data) return
    console.log(data.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/'))
  }, [data])

  return (
    <>
      {loading ? (
        <div className={styles.allNft}>
          <p className={styles.text}>Chargement...</p>
        </div>
      ) : (
        <div className={styles.allNft}>
          {!nftExist && (
            <div className={styles.nft}>
              <p className={styles.text}>This nft does not exist</p>
            </div>
          )}
          {data && nftExist && (
            <div>
              {data.animation_url ? (
                <div>
                  <iframe
                    className={styles.iframe}
                    scrolling="no"
                    src={data.animation_url.replace(
                      'ipfs://',
                      'https://ipfs.io/ipfs/',
                    )}
                  ></iframe>
                </div>
              ) : (
                <div>
                  <Image
                    width={1000}
                    height={1000}
                    className={styles.image}
                    src={data.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  />
                </div>
              )}

              <p className={styles.text}>Nft: {data?.name}</p>
              <p className={styles.text}>Description: {data?.description}</p>
            </div>
          )}
          {!data && nftExist && (
            <div className={styles.allNft}>
              <p className={styles.text}>This nft has no metadata</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default Nft
