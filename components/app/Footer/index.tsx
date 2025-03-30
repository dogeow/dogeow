import * as React from "react";

import BuiltBy from "./BuiltBy";
import PowerBy from "./PoweredBy";
import ICP from "./ICP";

export default function Footer() {
  return (
    <footer className="flex flex-wrap justify-center mt-auto gap-2">
        <PowerBy />
        <BuiltBy />
        <ICP />
    </footer>
  );
}
