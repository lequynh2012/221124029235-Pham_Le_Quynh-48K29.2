const margin = {top: 20, right: 100, bottom: 50, left: 200},
      width = 1650 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none");

d3.csv("data_ggsheet.csv").then(rawData => {
    const purchasesByCustomer = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Mã khách hàng"]
    );

    const distribution = d3.rollups(
        purchasesByCustomer,
        v => v.length,
        d => d[1]
    );

    const data = distribution.map(([purchaseCount, customerCount]) => ({
        purchaseCount: +purchaseCount,
        customerCount: +customerCount
    })).sort((a, b) => a.purchaseCount - b.purchaseCount);

    console.log("Phân phối lượt mua hàng:", data);

    const x = d3.scaleBand()
        .domain(data.map(d => d.purchaseCount))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.customerCount)])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d))
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("fill", "black")
        .attr("text-anchor", "middle");

    svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.purchaseCount))
        .attr("y", d => y(d.customerCount))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.customerCount))
        .attr("fill", "#00C5CD")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block");
            tooltip.html(`
                    <strong>Số lượt mua hàng:</strong> ${d.purchaseCount} <br/>
                    <strong>Số lượng KH:</strong> ${d3.format(",")(d.customerCount)}
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

}).catch(error => {
    console.error("Lỗi load dữ liệu:", error);
});
