import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "@redux/actions/user_action";
import "../styles/globals.css";
import "../styles/App.css";
import "../styles/scss-common.css";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import wrapper from "@redux/store/configureStore";
import { Button, ChakraProvider, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { auth, db } from "src/firebase";
import { ref, onValue, off, get, query, orderByChild, endBefore } from "firebase/database";
import { getStorage, ref as sRef, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import Layout from "@component/Layout";
import Login from "@component/Login";
import Loading from "@component/Loading";
import {setLogo} from "@redux/actions/logo_action"
import { format, getMonth, getDate } from "date-fns";
import styled from "styled-components";
import { AiOutlineAlert } from "react-icons/ai"
import PaymentAlertPop from "@component/ragular/PaymentAlertPop";


const BtnRegular = styled.button`
  position:fixed;left:2rem;bottom:2rem;
  background:#ED8936;color:#fff;
  border-radius:50%;width:50px;height:50px;
  display:flex;align-items:center;justify-content:center;
  font-size:22px;box-shadow:0 0 6px rgba(0,0,0,0.3)
`

function App({ Component, pageProps }) {
  const storage = getStorage();
  const dispatch = useDispatch();
  const router = useRouter();
  const userInfo = useSelector((state) => state.user.currentUser);
  
  const path = router.pathname;
  const [authCheck, setAuthCheck] = useState(false);
  const [isLoading, setisLoading] = useState(true);

  const publicPath = ["/login", "/join"];
  const isPublicPath = publicPath.includes(path);
  const setVh = () => {
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight * 0.01}px`
    );
  };

  useEffect(() => {
    const handleStart = (url) => {
      NProgress.start();
    };
    const handleStop = () => {
      NProgress.done();
    };
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  useEffect(() => {
    window.addEventListener("resize", setVh);
    return () => {
      window.removeEventListener("resize", setVh);
    };
  }, []);

  const [logoImg, setLogoImg] = useState();
  useEffect(() => {
    getDownloadURL(sRef(storage, `company/logo`))
      .then((url) => {
        dispatch(setLogo(url))
        setLogoImg(url);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        const isLogin = window.sessionStorage.getItem("isLogin");
        if (!isLogin) {
          signOut(auth)
            .then((res) => {
              dispatch(clearUser());
            })
            .then((res) => router.push("/login"))
            .catch((error) => {
              console.log(error);
            });
        }
        const userRef = ref(db, `user/${user.uid}`);
        onValue(userRef, (data) => {
          if (data.val()) {
            let userData = {
              ...user,
              ...data.val(),
            };
            dispatch(setUser(userData));
          }
        });
        setAuthCheck(true);
      } else {
        window.sessionStorage.setItem("isLogin", false);
        dispatch(clearUser());
        setAuthCheck(false);
        if (isPublicPath) {
          router.push("/login");
        }
      }
      setisLoading(false);
    });
  }, []);


  const [isPaymentPop, setIsPaymentPop] = useState(false)
  const [regularList, setRegularList] = useState()
  useEffect(() => {
    if(userInfo?.authority.includes('admin')){
      const curMonth = format(new Date(),"yyyyMM")
      const pRef = query(ref(db,`regular/list`),orderByChild('lastPayment'),endBefore(curMonth))
      onValue(pRef,data=>{
        let arr = [];
        const list = data.val();
        for(const key in list){
          list[key].uid = key
          arr.push(list[key])
        }
        setRegularList(arr)
      })

    }
  }, [userInfo,router])

  const onPaymentPop = () => {
    setIsPaymentPop(true)
  }

  const closePaymentPop = () => {
    setIsPaymentPop(false)
  }
  

  const getLayout =
    Component.getLayout ||
    ((page) => {
      return <Layout>{page}</Layout>;
    });

  return (
    <>
      <ChakraProvider>
        {isLoading ? (
          <>
            <Flex minHeight="100vh" justifyContent="center" alignItems="center">
              <Loading size={`xl`} />
            </Flex>
          </>
        ) : (
          <>
            {authCheck ? (
              <>
              {regularList && regularList.length > 0 &&
                <BtnRegular onClick={onPaymentPop}><AiOutlineAlert /></BtnRegular>
              }
              {
                isPaymentPop && <PaymentAlertPop regularList={regularList} closePop={closePaymentPop} />
              }
              {getLayout(<Component {...pageProps} />)}
              </>
            ) : (
              <>
                {isPublicPath ? (
                  getLayout(<Component {...pageProps} />)
                ) : (
                  <Login />
                )}
              </>
            )}
          </>
        )}
      </ChakraProvider>
    </>
  );
}

export default wrapper.withRedux(App);
