import {
  all,
  delay,
  put,
  takeLatest,
  call,
  takeEvery,
} from "redux-saga/effects";

import toast from "react-hot-toast";

import { ActionTypes } from "literals";

import {
  getUserSuccess,
  getUserFailure,
  generateOtpSuccess,
  generateOtpFailure,
  verifyOtpSuccess,
  verifyOtpFailure,
  updateUserSuccess,
  updateUserFailure,
  addCustomDomainSuccess,
  addCustomDomainFailure,
  resetState,
} from "actions";

import api from "../api";

export function* getUserSaga() {
  // do a fetch call to process.env.REACT_APP_TASKS_PUBLIC_URL
  // const response = yield call(fetch, 'https://jsonplaceholder.typicode.com/todos/1');
  // const data = yield response.json();


  try {
    const { data: res } = yield call(() =>
      api.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/details`,
        method: "POST",
        data: {
        },
      })
    );

    const { success, data, error } = res;

    if (success && data.user && data.isLoggedIn) {
      yield put(getUserSuccess(data.user));
    } else {
      yield put(getUserFailure({ error: error || "Something went wrong" }));

      if (!data.isLoggedIn) {
        // reset the state
        yield put(resetState());
        // if the user-details API fails, we need to clear the cookie
        // so that the user can login again
        document.cookie = `${
          process.env.REACT_APP_BTW_UUID_KEY || "btw_uuid"
        }=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // update the user state fresh
        yield put(getUserFailure({ error: error || "Something went wrong" }));
      }
    }
  } catch (e) {
    yield put(getUserFailure({ error: e.message }));
  }
}

export function* generateOtp({ payload }) {
  const { email } = payload || {};

  try {
    const { data } = yield call(() =>
      api.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/otp/generate`,
        method: "POST",
        data: {
          email,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(generateOtpSuccess({ success, error }));
    } else {
      yield put(generateOtpFailure({ error: error || "Something went wrong" }));
    }
  } catch (e) {
    yield put(
      generateOtpFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* verifyOtp({ payload }) {
  const { email, otp } = payload || {};

  try {
    const { data: res } = yield call(() =>
      api.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/otp/validate`,
        method: "POST",
        data: {
          email,
          otp,
        },
      })
    );

    const { success, data, error } = res;

    if (success && data.isValid) {
      // 200ms delay
      yield delay(200);

      // get user details
      yield call(getUserSaga);

      yield delay(200);

      yield put(verifyOtpSuccess());
    } else {
      yield put(verifyOtpFailure({ error: error || "Something went wrong" }));
    }
  } catch (e) {
    yield put(verifyOtpFailure({ error: e.message || "Something went wrong" }));
  }
}

export function* updateUser({ payload }) {
  const { name, slug, bio, pic, twitter, linkedin, instagram, settings } =
    payload || {};

  const toastId = toast.loading("Updating user details");

  try {
    const { data: res } = yield call(() =>
      api.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/update`,
        method: "POST",
        data: {
          name,
          slug,
          bio,
          pic,
          twitter,
          linkedin,
          instagram,
          settings,
        },
      })
    );

    const { success, error } = res;

    if (success) {
      yield put(updateUserSuccess());

      // call getUserSaga to update the user in the store
      yield call(getUserSaga);

      toast.success("Profile updated", {
        id: toastId,
      });
    } else {
      yield put(updateUserFailure({ error: error || "Something went wrong" }));

      toast.error(`Error: ${error}`, {
        id: toastId,
      });
    }
  } catch (e) {
    yield put(
      updateUserFailure({ error: e.message || "Something went wrong" })
    );

    toast.error(`Error: ${e.message}`, {
      id: toastId,
    });
  }
}

export function* addCustomDomain({ payload }) {
  const { domain } = payload || {};
  let toastId;

  if (domain) {
    toastId = toast.loading("Adding custom domain");
  }

  try {
    const { data: res } = yield call(() =>
      api.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/add/domain`,
        method: "POST",
        data: {
          domain,
        },
      })
    );

    const { success, error } = res;

    if (success) {
      yield put(addCustomDomainSuccess());

      if (domain) {
        toast.success(`Added domain: ${domain}`, {
          id: toastId,
        });

        toast.success(
          "Domain verification instructions will be sent to your email with in 24 hours"
        );
      } else {
        toast.success("Domain removed successfully");
      }

      // call getUserSaga to update the user in the store
      yield call(getUserSaga);
    } else {
      yield put(
        addCustomDomainFailure({ error: error || "Something went wrong" })
      );

      if (domain) {
        toast.error(`Error: ${error}`, {
          id: toastId,
        });
      }
    }
  } catch (e) {
    yield put(
      addCustomDomainFailure({ error: e.message || "Something went wrong" })
    );

    if (domain) {
      toast.error(`Error: ${e.message}`, {
        id: toastId,
      });
    }
  }
}

export default function* root() {
  yield all([
    takeEvery(ActionTypes.GET_USER, getUserSaga),
    takeEvery(ActionTypes.GENERATE_OTP, generateOtp),
    takeEvery(ActionTypes.VERIFY_OTP, verifyOtp),
    takeEvery(ActionTypes.UPDATE_USER, updateUser),
    takeEvery(ActionTypes.ADD_CUSTOM_DOMAIN, addCustomDomain),
  ]);
}
