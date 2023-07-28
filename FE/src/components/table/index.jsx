import CollapsibleTable from "./table"

const FeeTable = () => {
    return (
        <div style={{ display: "flex", width:"100%", margin:"20px", justifyContent:"center"}}>
            <div style={{flexBasis:"50%"}}>
                <CollapsibleTable />
            </div>
        </div>
    )
}

export default FeeTable