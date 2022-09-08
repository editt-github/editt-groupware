import React, { useState, useEffect } from "react";
import { db } from "src/firebase";
import { ref, onValue } from "firebase/database";
import useGetUser from "@component/hook/getUserDb";
import styled from "styled-components";
import { Button } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import InsaSkeleton from "@component/insa/InsaSkeleton";
import UserModifyPop from "@component/insa/UserModifyPop";
import { format } from 'date-fns';

const ListUl = styled.div`
  display: flex;
  flex-direction: column;
  > ul {
    display: flex;
  }
  .header {
    height: 55px;
    background: var(--p-color);
    color: #fff;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
  }
  .body {
    flex-direction: column;
    > li {
      display: flex;
      align-items: center;
    }
    .box {
      height: 50px;
      border-bottom: 1px solid #eaeaea;
    }
  }
  .box {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

export default function UserList() {
  useGetUser();  
  const [userData, setUserData] = useState();
  const userInfo = useSelector(state=>state.user.currentUser);
  const userAll = useSelector(state=>state.user.allUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isModifyPop, setIsModifyPop] = useState(false);
  
  const onUserModify = (uid) => {
    const dbRef = ref(db, `user/${uid}`);
    onValue(dbRef, (data) => {
      let user = {
        ...data.val(),
        uid: data.key,
      };
      setUserData(user);
      setIsModifyPop(true);
    });
  };
  const closeUserModify = () => {
    setUserData('');
    setIsModifyPop(false);
  }

  const [adminCheck, setAdminCheck] = useState(false)
  useEffect(()=>{
    if(userAll[0]){
      if(userInfo?.authority && userInfo.authority.includes('admin')){
        setAdminCheck(true)
      }
      setIsLoading(true)
    }
  },[])
  return (
    <>
    {isLoading ? (
      <>
        <ListUl>
          <ul className="header">
            <li className="box name">이름</li>
            <li className="box part">부서</li>
            <li className="box rank">직급</li>
            <li className="box call">전화번호</li>
            <li className="box email">이메일</li>
            <li className="box date">입사일</li>
            {
              adminCheck &&
              <>
                <li className="box dayoff"></li>
                <li className="box setting"></li>
              </>
            }
          </ul>
          <ul className="body">
            {userAll[0] &&
              userAll.map((el) => (
                <>
                  <li key={el.uid}>
                    <span className="box name">{el.name}</span>
                    <span className="box part">{el.part}</span>
                    <span className="box rank">{el.rank}</span>
                    <span className="box call">{el.call}</span>
                    <span className="box email">{el.email}</span>
                    <span className="box date">{format(new Date(el.date),"yyyy-MM-dd")}</span>
                    {adminCheck &&
                      <>
                      <span className="box email">{el.dayoff ? `${el.dayoff}일` : '' }</span>
                      <div className="box setting">
                        <Button
                          size="sm"
                          onClick={() => {
                            onUserModify(el.uid);
                          }}
                        >
                          관리
                        </Button>
                      </div>
                      </>
                    }
                  </li>
                </>
              ))}
          </ul>
        </ListUl>   
        {userData && isModifyPop &&
          <UserModifyPop userData={userData} closeUserModify={closeUserModify} />
        }
      </>
    ) : (
      <>
        <InsaSkeleton />
      </>
    )}
    
    </>
  );
}